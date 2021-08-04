import { Socket } from "socket.io-client";

export interface User {
  username: string;
  roomId: string;
  avatarURL: string;
  videoMuted: boolean;
  audioMuted: boolean;
  screenSharing: boolean;
}

// DEfault configuration - Change these if you have a different STUN or TURN server.
export const configuration: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function registerPeerConnectionListeners(
  peerConnection: RTCPeerConnection,
  remoteUser: string
): void {
  peerConnection.addEventListener("icegatheringstatechange", () => {
    console.log(
      `${remoteUser} ICE gathering state changed: ${peerConnection.iceGatheringState}`
    );
  });

  peerConnection.addEventListener("connectionstatechange", () => {
    console.log(
      `${remoteUser} Connection state change: ${peerConnection.connectionState}`
    );
  });

  peerConnection.addEventListener("signalingstatechange", () => {
    console.log(
      `${remoteUser} Signaling state change: ${peerConnection.signalingState}`
    );
  });

  peerConnection.addEventListener("iceconnectionstatechange ", () => {
    console.log(
      `${remoteUser} ICE connection state change: ${peerConnection.iceConnectionState}`
    );
  });
}
