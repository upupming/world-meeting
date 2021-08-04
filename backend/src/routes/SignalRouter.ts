import http from "http";
import { Server } from "socket.io";

export const signalServerInit = (server: http.Server): void => {
  console.log("signalServerInit");
  const io = new Server(server).of("/signal");
  io.on("connection", async (socket) => {
    console.log(socket);
    socket.emit("connected");

    // notify users upon disconnection
    socket.on("disconnect", async () => {
      console.log("disconnect");
    });
  });
};
