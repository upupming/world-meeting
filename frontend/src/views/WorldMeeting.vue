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

const stream = ref(new MediaStream());
const screenStream = ref(new MediaStream());

const videoTracks: Ref<MediaStreamTrack[]> = ref([]);
const audioTracks: Ref<MediaStreamTrack[]> = ref([]);
const screenTracks: Ref<MediaStreamTrack[]> = ref([]);

const connecting = ref(false);
const peerConnections = new Map<string, RTCPeerConnection>();
const remoteStreams = reactive(new Map<string, Ref<MediaStream>>());
const socket: Ref<null | Socket> = ref(null);

const remoteUsers: Ref<User[]> = ref([]);

const user = reactive({
  username: lorem.generateWords(2),
  roomId: lorem.generateWords(1),
  avatarURL: "",
  videoMuted: true,
  audioMuted: true,
  screenSharing: false,
});
interface TextMessage {
  from: string;
  message?: string;
}
interface FileMessage {
  from: string;
  /* 文件 uint8array 内容 */
  fileContent?: string;
  filename?: string;
  fileUrl?: string;
}

const messages: Ref<(TextMessage & FileMessage)[]> = ref([
  // {
  //   from: "test",
  //   message: "Hello world",
  // },
  // {
  //   from: "test1",
  //   fileContent: "Hellowef jerhgfj r",
  //   filename: "a.txt",
  //   fileUrl: window.URL.createObjectURL(new Blob(["Hellowef jerhgfj r"])),
  // },
]);

const sendMessage = (message: string) => {
  console.log("sendMessage", message);
  if (socket.value) {
    socket.value.emit("sendMessage", message);
  }
};
const sendFile = (file: File) => {
  console.log("sendFile", file);
  if (socket.value) {
    socket.value.emit("sendFile", {
      data: file,
      filename: file.name,
      type: file.type,
    });
  }
};

const removeTrack = (
  trackToBeRemoved: MediaStreamTrack,
  streamOfTracks: MediaStream
) => {
  peerConnections.forEach((peerConnection) => {
    const sender4Track = peerConnection
      .getSenders()
      .find((sender) => sender.track?.id === trackToBeRemoved.id);
    console.log(
      "remove track from peerConnection",
      sender4Track,
      peerConnection
    );
    if (sender4Track) {
      peerConnection.removeTrack(sender4Track);
    }
  });
  streamOfTracks.removeTrack(trackToBeRemoved);
};

const removeTracks = (
  tracksToBeRemoved: Ref<MediaStreamTrack[]>,
  streamOfTracks: MediaStream
) => {
  tracksToBeRemoved.value.forEach((track) => {
    removeTrack(track, streamOfTracks);
    track.onended = track.onmute = track.onunmute = null;
  });
  tracksToBeRemoved.value = [];
};

// See the upgrade demo: https://github.com/webrtc/samples/blob/6ee1b909e4a04a8f5f02283e70cbadb8e73742b1/src/content/peerconnection/upgrade/js/main.js#L178
const upgradeRTCWithNewTracks = (tracksToBeAdded: Ref<MediaStreamTrack[]>) => {
  peerConnections.forEach(async (peerConnection, remoteUsername) => {
    tracksToBeAdded.value.forEach((track) => {
      peerConnection.addTrack(track);
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
};

const onToggleScreenStream = async () => {
  if (user.screenSharing) {
    user.screenSharing = false;
    // 移除之前的屏幕共享 track
    removeTracks(screenTracks, screenStream.value);
  } else {
    user.screenSharing = true;
    // 屏幕贡献的只是视频，音频不管
    const screenStreamTmp = (await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    })) as MediaStream;
    screenTracks.value = screenStreamTmp.getVideoTracks();
    screenTracks.value.forEach((track) => {
      screenStream.value.addTrack(track);
      // 停止共享的话
      track.onended = () => {
        console.log("screenStream track ended", track);
        removeTrack(track, screenStream.value);
        screenStream.value = new MediaStream(screenStream.value);
        user.screenSharing = false;
        track.onended = track.onmute = track.onunmute = null;
      };
    });
    upgradeRTCWithNewTracks(screenTracks);
  }
};

onMounted(async () => {
  console.log("mounted");
  try {
    // 只是为了获取权限，使得 enumerateDevices 能够正常运行
    (
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
    )
      .getTracks()
      .forEach((track) => track.stop());
  } catch (err) {
    ElMessage(`获取音视频失败，可能无法进行后续操作: ${JSON.stringify(err)}`);
    console.error(err);
    return;
  }

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
    removeTracks(videoTracks, stream.value);
    // 建一个新的 stream，不然的话会出现 video 组件继续显示卡住的图片的情况
    // 这样重新赋新值的话就让 video 重新不可见了，展示默认的头像元素
    stream.value = new MediaStream(stream.value);
  } else {
    // 请求视频 track
    const videoStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    videoTracks.value = videoStream.getVideoTracks();
    videoTracks.value.forEach((track) => {
      stream.value.addTrack(track);
    });
    upgradeRTCWithNewTracks(videoTracks);
  }
};
const updateAudioMuted = async (updatedMuted: boolean) => {
  console.log("updateAudioMuted", updatedMuted);
  if (user.audioMuted === updatedMuted) return;
  user.audioMuted = updatedMuted;
  if (user.audioMuted) {
    // 移除之前的音频 track
    removeTracks(audioTracks, stream.value);
  } else {
    // 请求音频 track
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    audioTracks.value = audioStream.getAudioTracks();
    audioTracks.value.forEach((track) => {
      stream.value.addTrack(track);
    });
    upgradeRTCWithNewTracks(audioTracks);
  }
};
const updateVideoDevice = (updatedVideoDevice: string) => {
  if (updatedVideoDevice !== selectedVideoDeviceId.value) {
    console.log(
      "update:videoDevice",
      "before",
      selectedVideoDeviceId.value,
      "now",
      updatedVideoDevice
    );
    updateVideoMuted(true);
    selectedVideoDeviceId.value = updatedVideoDevice;
    updateVideoMuted(false);
  }
};
const updateAudioDevice = (updatedAudioDevice: string) => {
  if (updatedAudioDevice !== selectedAudioDeviceId.value) {
    console.log(
      "update:audioDevice",
      "before",
      selectedAudioDeviceId.value,
      "now",
      updatedAudioDevice
    );
    updateAudioMuted(true);
    selectedAudioDeviceId.value = updatedAudioDevice;
    updateAudioMuted(false);
  }
};

const userInfoDialogVisible = ref(false);
const handleUserInfoDialogCancel = () => {
  userInfoDialogVisible.value = false;
};
const handleUserInfoDialogConfirm = () => {
  userInfoDialogVisible.value = false;
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
    const remoteStream = remoteStreams.get(remoteUser)!.value;
    console.log(
      `Add a track from ${remoteUser} to the remoteStream:`,
      remoteStream,
      event.track
    );
    // 流终止的话
    event.track.onended = () => {
      console.log("track ended", event.track);
      remoteStream.removeTrack(event.track);
      if (remoteStreams.get(remoteUser)) {
        remoteStreams.get(remoteUser)!.value = new MediaStream(remoteStream);
      }
      event.track.onended = event.track.onmute = event.track.onunmute = null;
    };
    // 对方主动调用了 removeTrack
    let mutedTimeout: NodeJS.Timeout | undefined = undefined;
    event.track.onmute = () => {
      console.log("track muted", event.track);
      // 防止过快地 mute/unmted 交互
      if (mutedTimeout) return;
      mutedTimeout = setTimeout(() => {
        remoteStream.removeTrack(event.track);
        if (remoteStreams.get(remoteUser)) {
          remoteStreams.get(remoteUser)!.value = new MediaStream(remoteStream);
        }
      }, 1000);
    };
    event.track.onunmute = () => {
      console.log("track unmuted", event.track);
      if (mutedTimeout) {
        console.log("clear mutedTimeout directly");
        clearTimeout(mutedTimeout);
      } else {
        remoteStream.addTrack(event.track);
        if (remoteStreams.get(remoteUser)) {
          remoteStreams.get(remoteUser)!.value = new MediaStream(remoteStream);
        }
      }
    };
    remoteStream.addTrack(event.track);
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
    peerConnection.addTrack(track);
  });
  audioTracks.value.forEach((track) => {
    console.log("offer track", track);
    peerConnection.addTrack(track);
  });
  screenTracks.value.forEach((track) => {
    console.log("offer track", track);
    peerConnection.addTrack(track);
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

const onToggleCall = async () => {
  if (socket.value) {
    console.log("断开连接");
    ElMessage("连接已断开");
    socket.value.disconnect();
    return;
  }

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
    peerConnections.clear();
    messages.value = [];
    connecting.value = false;
    remoteStreams.clear();
    remoteUsers.value = [];
    socket.value = null;
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
      peerConnection.addTrack(track);
    });
    audioTracks.value.forEach((track) => {
      console.log("answer track", track, Date.now());
      peerConnection.addTrack(track);
    });
    screenTracks.value.forEach((track) => {
      console.log("answer track", track, Date.now());
      peerConnection.addTrack(track);
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
  socket.value.on("new-file", ({ fileContent, filename, from, type }) => {
    console.log("new file", fileContent, filename, from, type);
    messages.value.push({
      fileContent,
      filename,
      from,
      fileUrl: window.URL.createObjectURL(new Blob([fileContent], { type })),
    });
  });
  socket.value.on("update-user", (updatedUser) => {
    console.log("update-user", updatedUser);
    for (let i = 0; i < remoteUsers.value.length; i++) {
      if (remoteUsers.value[i].username === updatedUser.username) {
        remoteUsers.value[i] = updatedUser;
      }
    }
  });
  socket.value.on("delete-user", (deletedUsername) => {
    console.log("delete-user", deletedUsername);
    const remoteUserIndex = remoteUsers.value.findIndex(
      (remoteUser) => remoteUser.username
    );
    if (remoteUserIndex !== -1) {
      remoteUsers.value.splice(remoteUserIndex, 1);
    }
    if (peerConnections.has(deletedUsername)) {
      peerConnections.get(deletedUsername)!.close();
      peerConnections.delete(deletedUsername);
    }
    remoteStreams.delete(deletedUsername);
  });
  socket.value.on("dup-username", () => {
    console.log("dup-username");
    ElMessage(
      "Duplicate username, please change your username or join another room"
    );
    socket.value?.disconnect();
  });

  // 将 username 和 roomId 附在 socket 上之后再 connect
  socket.value.auth = user;
  socket.value.connect();

  connecting.value = false;
};
</script>

<template>
  <div class="world-meeting-main">
    <div class="world-meeting-header">
      <div class="world-meeting-title">
        <img
          class="world-meeting-title-logo"
          src="/logo/logo_transparent.png"
        />
      </div>
      <div class="world-meeting-userinfo">
        <div class="world-meeting-userinfo-container">
          <div class="world-meeting-username">
            Username: {{ user.username || "暂无" }}
          </div>
          <div class="world-meeting-roomId">
            Room ID: {{ user.roomId || "暂无" }}
          </div>
          <div
            :class="{
              'world-meeting-user-icon': true,
              connected: socket,
            }"
            @click="!socket && (userInfoDialogVisible = true)"
          >
            <i class="fas fa-user"></i>
          </div>
        </div>
      </div>
    </div>
    <div class="world-meeting-content">
      <div class="world-meeting-center">
        <div class="world-meeting-avatars-container">
          <div class="world-meeting-avatars">
            <AvatarCard
              :avatarURL="user.avatarURL"
              :username="user.username || 'No Username'"
              :muted="user.audioMuted"
              @update:muted="updateAudioMuted"
              :srcObject="user.screenSharing ? screenStream : stream"
              :is-me="true"
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
        <div class="world-meeting-actions">
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
          <div class="world-meeting-action-container">
            <div
              :class="{
                'world-meeting-action': true,
                muted: !user.screenSharing,
              }"
              @click="onToggleScreenStream"
            >
              <i class="fas fa-desktop"></i>
            </div>
          </div>
          <div class="world-meeting-action-container">
            <div
              :class="{
                'world-meeting-action': true,
                muted: !socket,
                connecting,
              }"
              @click="onToggleCall"
            >
              <i class="fas fa-phone"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="world-meeting-right">
        <div class="world-meeting-participants">
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
        <div class="world-meeting-chat">
          <div class="world-meeting-chat-messages">
            <div
              v-for="message in messages"
              :key="JSON.stringify(message)"
              :class="{
                'world-meeting-chat-message': true,
                me: message.from === user.username,
              }"
            >
              <span class="world-meeting-chat-from">{{ message.from }}</span>
              <br />
              <span v-if="message.message" class="world-meeting-chat-text">{{
                message.message
              }}</span>
              <a
                v-if="message.fileContent"
                :href="message.fileUrl"
                :download="message.filename"
                class="world-meeting-chat-text"
              >
                {{ message.filename }}
              </a>
            </div>
          </div>
        </div>
        <div class="world-meeting-chat-inputbox">
          <InputBox
            v-model="message"
            @send:file="sendFile"
            @send:message="sendMessage"
          />
        </div>
      </div>
    </div>
    <div class="world-meeting-footer"></div>
  </div>

  <el-dialog
    title="Please input user info"
    v-model="userInfoDialogVisible"
    width="30%"
    :before-close="handleUserInfoDialogCancel"
  >
    <div class="input-line">
      <label class="input-label">Username</label>
      <el-input
        placeholder="Please enter username"
        v-model="user.username"
        clearable
      >
      </el-input>
    </div>
    <div class="input-line">
      <label class="input-label">Room ID</label>
      <el-input
        placeholder="Please enter room ID"
        v-model="user.roomId"
        clearable
      >
      </el-input>
    </div>
    <div class="input-line">
      <label class="input-label">Avatar</label>
      <el-input
        placeholder="Please enter avatar URL"
        v-model="user.avatarURL"
        clearable
      >
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

.world-meeting {
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
    position: relative;
    &-logo {
      position: absolute;
      top: -32px;
      width: 64px;
      height: 64px;
    }
  }
  &-userinfo {
    height: 100%;
    flex-grow: 1;
    position: relative;
    &-container {
      position: absolute;
      right: 96px;
      display: flex;
      align-items: center;
      top: 0;
      bottom: 0;
    }
  }
  &-user-icon {
    padding-left: 32px;
    padding-top: 6px;
    font-size: 24px;
    cursor: pointer;
    &:hover {
      color: fade(@foreground, 50%);
    }
    &.connected {
      color: @green;
      &:hover {
        cursor: not-allowed;
      }
    }
  }
  &-username {
    padding-left: 32px;
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
      padding-bottom: 24px;
      .world-meeting-chat-from {
        left: 0;
        position: absolute;
      }
      .world-meeting-chat-text {
        padding-top: 12px;
        left: 12px;
        position: absolute;
      }
      &.me {
        .world-meeting-chat-from {
          right: 0;
          text-align: right;
        }
        .world-meeting-chat-text {
          right: 12px;
          text-align: right;
        }
        .world-meeting-chat-from {
          right: 0;
        }
        .world-meeting-chat-text {
          right: 12px;
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
      &:hover {
        background-color: lighten(@red, 20%);
      }
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
