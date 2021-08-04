'use strict'
import { User } from "./lib/User";
const mediasoup = require('mediasoup');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
	pingTimeout: 3000,
	pingInterval: 5000,
});
const log4js = require('log4js');
const logger = log4js.getLogger();
const port = process.env.PORT || 3000;

// 已注册用户列表(登录成功即注册), k-用户名, v-用户对象
const usersMap = new Map<string, User>();

// 日志测试
logger.level = 'info';
logger.debug('this is a debug');
logger.info('this is a info');
logger.warn('this is a warn');

// 日志配置项
log4js.configure({
    appenders: {
        file: {
            type: 'file',
            filename: 'app.log',
            layout: {
                type: 'pattern',
                pattern: '%r %p - %m',
            }
        }
    },
    categories: {
       default: {
          appenders: ['file'],
          level: 'debug'
       }
    }
});

// // 房间可同时在线的最大用户数(暂定为3)
// const MAXUSERCOUNT = 3;

// app.use(app.json());
// app.use(app.urlencoded({ extended: false }));

// app.get('/api', (req, res, next) => {
//  res
//     .status(200)
//     .json(
//       {
//        msg: "Hello world(no need for token)"
//    }
//     );
//   next();
// })

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 连接事件处理
io.on('connection', (socket) => {
	// 用户加入房间
	socket.on('join', (room, user) => {
		// 获取输入的用户名
        socket.userName = user.userName;
        // 用户注册过
		if (usersMap.has(socket.userName)) {
			var curUser = usersMap.get(socket.userName);
			// 用户已在线
			if (curUser.status == 1) {
				socket.emit('userHasExisted', {err: '用户已在线'});
            	socket.userName = null;
			} else {  // 用户已离线, 则上线
				curUser.status = 1;
				curUser.recentEnterTime = Date.now();
			}
		}
		// 否则(用户未注册过/用户注册过且离线), 用户可进入房间
		if (socket.userName != null) {
			// 加入
			io.join(room, user);
			usersMap.set(socket.userName, new User(socket.userName, 1));

			// 获取当前房间curRoom以及当前房间内的人数curUsers
			var curRoom = io.adapter.rooms[room];
			var curUsers = (curRoom)? Object.keys(curRoom.sockets).length : 0;
			logger.debug('The user number of current room (' + room + ') are: ' + curUsers);
			// 发给除自己之外的房间内的所有人
			io.emit('joined', room, socket.id);
			// 通知现有用户, 有人来了
			if(curUsers >= 1) {
				socket.to(room).emit('otherjoin', room, socket.id);
			}
		}
	});

	// 实时聊天
	socket.on('sendMessages', (room, data) => {
		logger.debug('Send messages, room: ' + room + ", data: " + data);
		// 给另一端(房间内的所有人)发送消息
		socket.to(room).emit('msg', room, data);
	});

	// 实时文件传送
	socket.on('sendFiles', (room, data) => {
		logger.debug('Send files, room: ' + room);
		// 给另一端(房间内的所有人)发送文件
		socket.to(room).emit('file', room, data);
	});
	
    // 用户离开房间(显然此用户已在线)
	socket.on('leave', (room, user) => {
		// 从管理列表中将用户删除(假删除)
		io.leave(room);
		var curUser = usersMap.get(user.userName); 
		curUser.status = 0;
		curUser.recentLeaveTime = Date.now();
		// 获取当前房间curRoom以及当前房间内的人数curUsers
		var curRoom = io.adapter.rooms[room]; 
		var curUsers = (curRoom)? Object.keys(curRoom.sockets).length : 0;
		logger.debug('The user number of current room (' + room + ') are: ' + curUsers);
		// 通知其他用户有人离开
		socket.to(room).emit('bye', room, socket.id);
		// 通知用户服务器已处理
		io.emit('leaved', room, socket.id);
	});
});

http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/ successfully!`);
});