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
      urls: "turn:numb.viagenie.ca",
      username: "upupming@gmail.com",
      credential: "mnbvcxz0707",
    },
    {
      urls: "turn:116.62.240.129:3478",
      username: "world",
      credential: "meeting",
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
    if (peerConnection.connectionState === "failed") {
      console.log("restarting ICE");
      peerConnection.restartIce();
    }
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
