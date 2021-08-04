<script setup lang="ts">
import AvatarCard from "../components/AvatarCard.vue";
import ParticipantCard from "../components/ParticipantCard.vue";
import { io, Socket } from "socket.io-client";
import VideoButton from "../components/VideoButton.vue";
import AudioButton from "../components/AudioButton.vue";
import { onMounted, reactive, ref, watch } from "vue";
import type { Ref } from "vue";
import InputBox from "../components/InputBox.vue";
import { LoremIpsum } from "lorem-ipsum";
import { ElMessage } from "element-plus";
import { configuration, registerPeerConnectionListeners } from "../webrtc";
import type { User } from "../webrtc";

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 6,
    min: 2,
  },
});

const message = ref("");

const videoDevices: Ref<MediaDeviceInfo[]> = ref([]);
const audioDevices: Ref<MediaDeviceInfo[]> = ref([]);
const selectedVideoDeviceId = ref("");
const selectedAudioDeviceId = ref("");

const stream = new MediaStream();
const screenStream = new MediaStream();

const videoTracks: Ref<MediaStreamTrack[]> = ref([]);
const audioTracks: Ref<MediaStreamTrack[]> = ref([]);
const screenTracks: Ref<MediaStreamTrack[]> = ref([]);

const connecting = ref(false);
const peerConnections = new Map<string, RTCPeerConnection>();
const remoteStreams = reactive(new Map<string, Ref<MediaStream>>());
const socket: Ref<null | Socket> = ref(null);
const trackId2Sender = new Map<string, RTCRtpSender>();

const remoteUsers: Ref<User[]> = ref([]);

const user = reactive({
  username: "",
  roomId: "",
  avatarURL: "",
  videoMuted: true,
  audioMuted: true,
  screenSharing: false,
});
interface Message {
  from: string;
  message: string;
}

const messages: Ref<Message[]> = ref([]);

const sendMessage = (message: string) => {
  console.log("sendMessage", message);
  if (socket.value) {
    socket.value.emit("sendMessage", message);
  }
};
const sendFile = (file: File) => {
  console.log("sendFile", file);
};

// TODO: 支持 remove track

const onToggleScreenStream = async () => {
  if (user.screenSharing) {
    user.screenSharing = false;
    // 屏幕贡献的只是视频，音频不管
    screenStream.getVideoTracks().forEach((track) => {
      screenStream.removeTrack(track);
    });
  } else {
    user.screenSharing = true;
    (
      (await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })) as MediaStream
    )
      .getVideoTracks()
      .forEach((track) => {
        screenStream.addTrack(track);
      });
  }
};

onMounted(async () => {
  console.log("mounted");
  // 只是为了获取权限，使得 enumerateDevices 能够正常运行
  (
    await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })
  )
    .getTracks()
    .forEach((track) => track.stop());

  const devices = await navigator.mediaDevices.enumerateDevices();
  videoDevices.value = devices.filter((device) => device.kind === "videoinput");
  audioDevices.value = devices.filter((device) => device.kind == "audioinput");
  selectedVideoDeviceId.value = videoDevices.value[0].deviceId;
  selectedAudioDeviceId.value = audioDevices.value[0].deviceId;
});

const updateVideoMuted = async (updatedMuted: boolean) => {
  console.log("updateVideoMuted", updatedMuted);
  if (user.videoMuted === updatedMuted) return;
  user.videoMuted = updatedMuted;
  if (user.videoMuted) {
    // 移除之前的视频 track
    videoTracks.value.forEach((track) => {
      peerConnections.forEach((peerConnection) => {
        peerConnection.removeTrack(trackId2Sender.get(track.id)!);
        trackId2Sender.delete(track.id);
      });
      stream.removeTrack(track);
    });
    videoTracks.value = [];
  } else {
    // 请求视频 track
    const videoStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    videoTracks.value = videoStream.getVideoTracks();
    videoTracks.value.forEach((track) => {
      stream.addTrack(track);
    });
    peerConnections.forEach(async (peerConnection, remoteUsername) => {
      videoTracks.value.forEach((track) => {
        console.log("updateVideoMuted add track", peerConnection, track);
        trackId2Sender.set(track.id, peerConnection.addTrack(track));
      });
      // 需要重新进行 offer-answer 过程
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerConnection.setLocalDescription(offer);
      console.log("created offer", offer);

      socket.value?.emit("createOffer", {
        from: user.username,
        to: remoteUsername,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });
    });
  }
};
const updateAudioMuted = async (updatedMuted: boolean) => {
  console.log("updateAudioMuted", updatedMuted);
  if (user.audioMuted === updatedMuted) return;
  user.audioMuted = updatedMuted;
  if (user.audioMuted) {
    // 移除之前的音频 track
    audioTracks.value.forEach((track) => {
      peerConnections.forEach((peerConnection) => {
        peerConnection.removeTrack(trackId2Sender.get(track.id)!);
        trackId2Sender.delete(track.id);
      });
      stream.removeTrack(track);
    });
    audioTracks.value = [];
  } else {
    // 请求音频 track
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    audioTracks.value = audioStream.getAudioTracks();
    audioTracks.value.forEach((track) => {
      peerConnections.forEach((peerConnection) => {
        trackId2Sender.set(track.id, peerConnection.addTrack(track));
      });
      stream.addTrack(track);
    });
  }
};
const updateVideoDevice = (updatedVideoDevice: string) => {
  console.log("update:videoDevice", updatedVideoDevice);
  selectedVideoDeviceId.value = updatedVideoDevice;
};
const updateAudioDevice = (updatedAudioDevice: string) => {
  console.log("update:audioDevice", updatedAudioDevice);
  selectedAudioDeviceId.value = updatedAudioDevice;
};

const userInfoDialogVisible = ref(false);
const handleUserInfoDialogCancel = () => {
  userInfoDialogVisible.value = false;
};
const handleUserInfoDialogConfirm = () => {
  userInfoDialogVisible.value = false;
  onStartCall();
};

// 当用户自主对音视频状态发生改变时，通知一下远端
watch([user], () => {
  if (!socket.value) return;
  socket.value.emit("updateUser", user);
});

const listenForTracks = (
  peerConnection: RTCPeerConnection,
  remoteUser: string
) => {
  console.log("listenForTracks", peerConnection, remoteUser);
  peerConnection.addEventListener("track", (event) => {
    console.log("Got remote track:", event);
    if (!remoteStreams.has(remoteUser)) {
      remoteStreams.set(remoteUser, ref(new MediaStream()));
    }
    console.log(
      `Add a track from ${remoteUser} to the remoteStream:`,
      event.track
    );
    remoteStreams.get(remoteUser)?.value.addTrack(event.track);
  });
};

// collect ICE Candidates function below
function collectIceCandidates(
  socket: Socket,
  peerConnection: RTCPeerConnection
): void {
  // 将搜集到的 ice 候选者放入数据库
  peerConnection.addEventListener("icecandidate", (event) => {
    if (event.candidate) {
      console.log("send local ice candidate to remote", event.candidate);
      socket.emit("newIcecandidate", {
        candidate: event.candidate,
      });
    }
  });
}

// 请求并和一个对等方建立连接
const connectPeerWithNewOffer = async (socket: Socket, remoteUser: User) => {
  if (peerConnections.has(remoteUser.username)) return;

  const peerConnection = new RTCPeerConnection(configuration);
  listenForTracks(peerConnection, remoteUser.username);
  registerPeerConnectionListeners(peerConnection, remoteUser.username);

  videoTracks.value.forEach((track) => {
    console.log("offer track", track);
    trackId2Sender.set(track.id, peerConnection.addTrack(track));
  });
  audioTracks.value.forEach((track) => {
    console.log("offer track", track);
    trackId2Sender.set(track.id, peerConnection.addTrack(track));
  });
  screenTracks.value.forEach((track) => {
    console.log("offer track", track);
    trackId2Sender.set(track.id, peerConnection.addTrack(track));
  });

  collectIceCandidates(socket, peerConnection);

  peerConnections.set(remoteUser.username, peerConnection);

  // offer 的类型是 RTCSessionDescriptionInit，后面调用 new RTCSessionDescription 的时候可以传入这个类型
  // 创建 offer 之前必须先把 localStream 里面加入一些 track 才行，否则不会触发 icecandidate 事件: https://stackoverflow.com/a/27758788/8242705
  const offer = await peerConnection.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  });
  await peerConnection.setLocalDescription(offer);
  console.log("created offer", offer);

  socket.emit("createOffer", {
    from: user.username,
    to: remoteUser.username,
    offer: {
      type: offer.type,
      sdp: offer.sdp,
    },
  });
};

const onStartCall = async () => {
  if (
    videoTracks.value.length === 0 &&
    audioTracks.value.length === 0 &&
    screenTracks.value.length === 0
  ) {
    ElMessage("请先开启音视频设备后再使用此功能");
    return;
  }
  if (!user.username || !user.roomId) {
    user.username = lorem.generateWords(1);
    user.roomId = lorem.generateWords(1);
    userInfoDialogVisible.value = true;
    return;
  }
  connecting.value = true;
  console.log("Create PeerConnection with configuration: ", configuration);

  socket.value = io("/signal", { autoConnect: false });
  socket.value.on("connect", () => {
    console.log("client connect");
  });

  socket.value.on("disconnect", () => {
    console.log("client disconnect");
    peerConnections.forEach((pc) => pc.close());
  });
  // 新加入房间的用户负责给之前所有的人都发一个 offer
  socket.value.on("retrieve-users", (receivedUsers: User[]) => {
    // 筛选掉当前用户
    remoteUsers.value = receivedUsers;
    console.log("retrieved remote users", remoteUsers.value);

    // 拿到所有的用户之后。一一尝试建立连接
    remoteUsers.value.forEach((remoteUser) => {
      connectPeerWithNewOffer(socket.value!, remoteUser);
    });
  });
  // 已经存在的人看到新来的人，不需要发 offer，而是等待其 answer
  socket.value.on("add-user", (remoteUser: User) => {
    if (
      remoteUsers.value.some((user) => user.username === remoteUser.username)
    ) {
      console.log("已经存在的用户，忽略", remoteUser);
      return;
    }
    console.log("add-user", remoteUser);
    remoteUsers.value.push(remoteUser);
  });

  socket.value.on("new-offer", async ({ offer, from }) => {
    console.log("new offer", offer, from);
    let peerConnection: RTCPeerConnection;
    if (peerConnections.has(from)) {
      console.log("用户的音视频状态改变导致重新 offer-answer");
      peerConnection = peerConnections.get(from)!;
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerConnection.setLocalDescription(answer);
      socket.value!.emit("createAnswer", {
        answer,
        from: user.username,
        to: from,
      });
      return;
    }
    peerConnection = new RTCPeerConnection(configuration);
    listenForTracks(peerConnection, from);

    await peerConnection.setRemoteDescription(offer);
    registerPeerConnectionListeners(peerConnection, from);

    collectIceCandidates(socket.value!, peerConnection);
    peerConnections.set(from, peerConnection);

    videoTracks.value.forEach((track) => {
      console.log("answer track", track, Date.now());
      trackId2Sender.set(track.id, peerConnection.addTrack(track));
    });
    audioTracks.value.forEach((track) => {
      console.log("answer track", track, Date.now());
      trackId2Sender.set(track.id, peerConnection.addTrack(track));
    });
    screenTracks.value.forEach((track) => {
      console.log("answer track", track, Date.now());
      trackId2Sender.set(track.id, peerConnection.addTrack(track));
    });

    const answer = await peerConnection.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerConnection.setLocalDescription(answer);

    socket.value!.emit("createAnswer", {
      answer,
      from: user.username,
      to: from,
    });
  });
  socket.value.on("new-answer", async ({ answer, from }) => {
    console.log("new answer", answer, from, Date.now());
    const peerConnection = peerConnections.get(from);
    if (!peerConnection) {
      console.log(`peerConnection for ${from} not found`);
      return;
    }
    await peerConnection.setRemoteDescription(answer);
  });
  socket.value.on("new-icecandidate", ({ candidate, from }) => {
    const peerConnection = peerConnections.get(from);
    if (!peerConnection) return;
    console.log("added remote ice candidate", from, candidate);
    peerConnection.addIceCandidate(candidate);
  });
  socket.value.on("new-message", (message) => {
    messages.value.push(message);
  });

  // 将 username 和 roomId 附在 socket 上之后再 connect
  socket.value.auth = user;
  socket.value.connect();

  connecting.value = false;
};
</script>

<template>
  <div class="byte-meeting-main">
    <div class="byte-meeting-header">
      <div class="byte-meeting-title">Byte Meeting</div>
      <div class="byte-meeting-username">
        用户名: {{ user.username || "暂无" }}
      </div>
      <div class="byte-meeting-roomId">房间号: {{ user.roomId || "暂无" }}</div>
    </div>
    <div class="byte-meeting-content">
      <div class="byte-meeting-center">
        <div class="byte-meeting-avatars-container">
          <div class="byte-meeting-avatars">
            <AvatarCard
              :avatarURL="
                user.avatarURL ||
                'https://avatars.githubusercontent.com/u/24741764?v=4'
              "
              :username="user.username || '暂无用户名'"
              :muted="user.audioMuted"
              @update:muted="updateAudioMuted"
              :src-object="user.screenSharing ? screenStream : stream"
            />
            <AvatarCard
              v-for="user in remoteUsers"
              :key="user.roomId + user.username"
              :srcObject="remoteStreams.get(user.username)?.value"
              :avatarURL="user.avatarURL"
              :username="user.username"
              :muted="user.audioMuted"
            />
          </div>
        </div>
        <div class="byte-meeting-actions">
          <VideoButton
            :videoDevices="videoDevices"
            :selectedVideoDeviceId="selectedVideoDeviceId"
            :muted="user.videoMuted"
            @update:muted="updateVideoMuted"
            @update:videoDevice="updateVideoDevice"
          />
          <AudioButton
            :audioDevices="audioDevices"
            :selectedAudioDeviceId="selectedAudioDeviceId"
            :muted="user.audioMuted"
            @update:muted="updateAudioMuted"
            @update:audioDevice="updateAudioDevice"
          />
          <div class="byte-meeting-action-container">
            <div
              :class="{
                'byte-meeting-action': true,
                muted: !user.screenSharing,
              }"
              @click="onToggleScreenStream"
            >
              <i class="fas fa-desktop"></i>
            </div>
          </div>
          <div class="byte-meeting-action-container">
            <div
              :class="{
                'byte-meeting-action': true,
                muted: !socket,
                connecting,
              }"
              @click="onStartCall"
            >
              <i class="fas fa-phone"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="byte-meeting-right">
        <div class="byte-meeting-participants">
          <ParticipantCard
            v-bind="user"
            @update:videoMuted="updateVideoMuted"
            @update:audioMuted="updateAudioMuted"
          />
          <ParticipantCard
            v-for="user in remoteUsers"
            v-bind="user"
            :key="user.roomId + user.username"
          />
        </div>
        <div class="byte-meeting-chat">
          <div class="byte-meeting-chat-messages">
            <div
              v-for="message in messages"
              :key="message.message"
              :class="{
                'byte-meeting-chat-message': true,
                me: message.from === user.username,
              }"
            >
              <span class="byte-meeting-chat-from">{{ message.from }}</span>
              <br />
              <span class="byte-meeting-chat-text">{{ message.message }}</span>
            </div>
          </div>
        </div>
        <div class="byte-meeting-chat-inputbox">
          <InputBox
            v-model="message"
            @send:file="sendFile"
            @send:message="sendMessage"
          />
        </div>
      </div>
    </div>
    <div class="byte-meeting-footer"></div>
  </div>

  <el-dialog
    title="请输入用户信息"
    v-model="userInfoDialogVisible"
    width="30%"
    :before-close="handleUserInfoDialogCancel"
  >
    <div class="input-line">
      <label class="input-label">用户名</label>
      <el-input placeholder="请输入用户名" v-model="user.username" clearable>
      </el-input>
    </div>
    <div class="input-line">
      <label class="input-label">房间号</label>
      <el-input placeholder="请输入房间号" v-model="user.roomId" clearable>
      </el-input>
    </div>
    <div class="input-line">
      <label class="input-label">头像 </label>
      <el-input placeholder="请输入头像地址" v-model="user.avatarURL" clearable>
      </el-input>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleUserInfoDialogCancel">Cancel</el-button>
        <el-button type="primary" @click="handleUserInfoDialogConfirm"
          >Confirm</el-button
        >
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
@import "../assets/less/common.less";

.byte-meeting {
  &-main {
    flex-grow: 1;
  }
  &-header {
    height: 64px;
    width: 100%;
    display: flex;
    align-items: center;
    box-shadow: 0 5px 10px 0 rgb(0 0 0 / 15%);
    position: fixed;
    z-index: 100;
    background-color: @outer-color;
  }
  &-title {
    padding-left: 12px;
    font-size: 32px;
  }
  &-username {
    padding-left: 124px;
    font-size: 24px;
  }
  &-roomId {
    padding-left: 32px;
    font-size: 24px;
  }
  &-content {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    flex-grow: 1;
    display: flex;
    padding-top: 64px;
  }
  &-center {
    display: flex;
    flex-direction: column;
    width: 70%;
    flex-grow: 1;
  }
  &-avatars {
    display: grid;
    grid-template-columns: auto auto auto;
    grid-auto-rows: 240px;
    padding: 10px;
    grid-row-gap: 20px;
    grid-column-gap: 20px;
    background-color: @inner-color;
    flex-grow: 1;
    &-container {
      overflow: auto;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
  }
  &-actions {
    padding: 12px;
    display: grid;
    grid-template-columns: auto auto auto auto;
    align-items: center;
    background-color: @outer-color;
    box-shadow: 10px 5px 10px 10px rgb(0 0 0 / 15%);
  }
  &-right {
    width: 480px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  &-participants {
    height: 50%;
    overflow: auto;
    box-shadow: 0 5px 10px 0 rgb(0 0 0 / 15%);
    background-color: @outer-color;
  }
  &-chat {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: scroll;
    &-messages {
      flex-grow: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      padding-bottom: 12px;
    }
    &-message {
      position: relative;
      margin: 12px 12px 0 12px;
      &.me {
        span {
          float: right;
          text-align: right;
        }
      }
    }
    &-from {
      color: @orange;
      font-size: 24px;
    }
    &-inputbox {
      padding: 12px 0;
      box-shadow: 10px 5px 10px 10px rgb(0 0 0 / 15%);
    }
    box-shadow: 10px 5px 10px 10px rgb(0 0 0 / 15%);
    background-color: @outer-color;
  }
  &-action {
    cursor: pointer;
    width: 72px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: lighten(@current-line, 10%);
    border-radius: 10px;
    &:hover {
      background-color: lighten(@current-line, 20%);
    }
    &.muted {
      background-color: @red;
    }
    &.connecting {
      background-color: fade(@red, 30%);
    }
    &-container {
      display: flex;
      justify-content: center;
    }
  }
}
.el-input {
  padding-left: 12px;
  width: 300px;
}
.input-line {
  margin-bottom: 12px;
}
</style>
