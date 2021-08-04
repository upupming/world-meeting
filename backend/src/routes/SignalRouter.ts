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
  const io = new Server(server).of("/signal");
  io.on("connection", async (socket) => {
    console.log(socket);
    // 将这个用户加入到内存数据中
    let user = socket.handshake.auth as User;
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
    socket.on("disconnect", async () => {
      console.log("disconnect");
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
  });
};
