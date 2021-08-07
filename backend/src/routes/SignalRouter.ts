import http from "http";
import { Server, Socket } from "socket.io";

export interface User {
  username: string;
  roomId: string;
  avatarURL: string;
  videoMuted: boolean;
  audioMuted: boolean;
  screenSharing: boolean;
}

// username -> user
const users: Map<string, User> = new Map();
const username2Socket: Map<string, Socket> = new Map();
const usersInRoom = new Map<string, Set<User>>();

export const signalServerInit = (server: http.Server): void => {
  console.log("signalServerInit");
  // https://github.com/socketio/socket.io/issues/3946#issuecomment-850704139
  const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    // transports: ["polling"],
    // allowUpgrades: false,
  }).of("/signal");
  io.on("connection", async (socket) => {
    console.log(socket);
    let user = socket.handshake.auth as User;

    if (
      usersInRoom.get(user.roomId) &&
      [...usersInRoom.get(user.roomId)!.values()].some(
        (u) => u.username === user.username
      )
    ) {
      socket.emit("dup-username");
      return;
    }

    // 将这个用户加入到内存数据中
    socket.join(user.roomId);
    username2Socket.set(user.username, socket);
    // 第一次连接成功，将其他所有 user 发给这个用户
    socket.emit("retrieve-users", [
      ...(usersInRoom.get(user.roomId)?.values() || []),
    ]);
    // 将这个用户存在内存里面
    users.set(user.username, user);
    if (!usersInRoom.get(user.roomId)) {
      usersInRoom.set(user.roomId, new Set());
    }
    usersInRoom.get(user.roomId)?.add(user);
    // 通知所有其他用户添加一下这个 user
    socket.to(user.roomId).emit("add-user", user);

    // notify users upon disconnection
    socket.on("disconnect", async (reason) => {
      console.log(socket, "disconnected with reason", reason);
      // 通知用户删除这个 user
      if (users.has(user.username)) {
        users.delete(user.username);
        username2Socket.delete(user.username);
        usersInRoom.get(user.roomId)?.delete(user);
        socket.to(user.roomId).emit("delete-user", user.username);
      }
    });
    socket.on("updateUser", (updatedUser: User) => {
      users.set(updatedUser.username, updatedUser);
      usersInRoom.get(user.roomId)?.delete(user);
      usersInRoom.get(user.roomId)?.add(updatedUser);
      user = updatedUser;

      socket.to(updatedUser.roomId).emit("update-user", updatedUser);
    });

    socket.on("createOffer", async ({ offer, from, to }) => {
      console.log("createOffer", offer, from, to);
      const toSocket = username2Socket.get(to);
      if (!toSocket) return;
      socket.to(toSocket.id).emit("new-offer", {
        offer,
        from,
      });
    });
    socket.on("createAnswer", async ({ answer, from, to }) => {
      console.log("createAnswer", answer, from, to);
      const toSocket = username2Socket.get(to);
      if (!toSocket) return;
      socket.to(toSocket.id).emit("new-answer", {
        answer,
        from,
      });
    });
    socket.on("newIcecandidate", ({ candidate }) => {
      console.log("received candidate from user", user.username, candidate);
      socket
        .to(user.roomId)
        .emit("new-icecandidate", { candidate, from: user.username });
    });
    socket.on("sendMessage", (message) => {
      io.to(user.roomId).emit("new-message", {
        message,
        from: user.username,
      });
    });
    socket.on("sendFile", (file) => {
      console.log("sendFile", file);
      io.to(user.roomId).emit("new-file", {
        /* file.data 是 unit8array */
        fileContent: file.data,
        filename: file.filename,
        from: user.username,
        type: file.type,
      });
    });
  });
};
