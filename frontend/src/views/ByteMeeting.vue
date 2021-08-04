<script setup lang="ts">
import AvatarCard from "../components/AvatarCard.vue";
import type { AvatarCardProps } from "../components/AvatarCard.vue";
import ParticipantCard from "../components/ParticipantCard.vue";
import type { ParticipantCardProps } from "../components/ParticipantCard.vue";
import { io } from "socket.io-client";
import VideoButton from "../components/VideoButton.vue";
import AudioButton from "../components/AudioButton.vue";
import { computed, onMounted, ref, watch } from "vue";
import type { Ref } from "vue";
import InputBox from "../components/InputBox.vue";

const avatarCardProps: AvatarCardProps[] = [
  {
    avatarURL: "https://avatars.githubusercontent.com/u/26238385?v=4",
    username: "Chang Zhenan",
    modelValue: false,
  },
  {
    avatarURL: "https://avatars.githubusercontent.com/u/50524446?v=4",
    username: "cr496352127",
    modelValue: true,
  },
  {
    avatarURL: "https://avatars.githubusercontent.com/u/32427415?v=4",
    username: "Leohh123",
    modelValue: false,
  },
  {
    avatarURL: "https://avatars.githubusercontent.com/u/4921203?v=4",
    username: "wallaceyuan",
    modelValue: false,
  },
  {
    avatarURL: "https://avatars.githubusercontent.com/u/24741764?v=4",
    username: "Yiming Li",
    modelValue: true,
  },
  {
    avatarURL: "https://avatars.githubusercontent.com/u/26238385?v=4",
    username: "Chang Zhenan",
    modelValue: false,
  },
  {
    avatarURL: "https://avatars.githubusercontent.com/u/50524446?v=4",
    username: "cr496352127",
    modelValue: true,
  },
  {
    avatarURL: "https://avatars.githubusercontent.com/u/32427415?v=4",
    username: "Leohh123",
    modelValue: false,
  },
  {
    avatarURL: "https://avatars.githubusercontent.com/u/4921203?v=4",
    username: "wallaceyuan",
    modelValue: false,
  },
  {
    avatarURL: "https://avatars.githubusercontent.com/u/24741764?v=4",
    username: "Yiming Li",
    modelValue: true,
  },
];
const avatarCardMutedRefs = [
  false,
  true,
  false,
  false,
  true,
  false,
  true,
  false,
  false,
  true,
].map((muted) => ref(muted));

const participantCardProps: ParticipantCardProps[] = avatarCardProps.map(
  (avatarCardProp) => ({
    avatarURL: avatarCardProp.avatarURL,
    username: avatarCardProp.username,
    audioMuted: false,
    videoMuted: false,
  })
);

const message = ref("");
const sendMessage = (message: string) => {
  console.log("sendMessage", message);
};
const sendFile = (file: File) => {
  console.log("sendFile", file);
};

const videoDevices: Ref<MediaDeviceInfo[]> = ref([]);
const audioDevices: Ref<MediaDeviceInfo[]> = ref([]);
const selectedVideoDeviceId = ref("");
const videoMuted = ref(true);
const selectedAudioDeviceId = ref("");
const audioMuted = ref(true);
const audioSource: Ref<null | string> = ref(null);
const videoSource: Ref<null | string> = ref(null);

const constraints = computed(() => ({
  audio: {
    deviceId: audioSource.value ? { exact: audioSource.value } : undefined,
  },
  video: {
    deviceId: videoSource.value ? { exact: videoSource.value } : undefined,
  },
}));
const stream: Ref<null | MediaStream> = ref(null);
const screenStream: Ref<null | MediaStream> = ref(null);
const onToggleScreenStream = async () => {
  if (screenStream.value) {
    screenStream.value.getTracks().forEach((track) => track.stop());
    screenStream.value = null;
  } else {
    screenStream.value = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
  }
  console.log(screenStream.value);
};

onMounted(async () => {
  console.log("mounted");
  const socket = io("/signal");
  socket.on("connect", () => {
    console.log("client connect");
  });

  socket.on("disconnect", () => {
    console.log("client disconnect");
  });
  // 只是为了获取权限，使得 enumerateDevices 能够正常运行
  await navigator.mediaDevices.getUserMedia(constraints.value);

  const devices = await navigator.mediaDevices.enumerateDevices();
  videoDevices.value = devices.filter((device) => device.kind === "videoinput");
  audioDevices.value = devices.filter((device) => device.kind == "audioinput");
});

watch([videoMuted, audioMuted], async () => {
  // 请求音视频设备
  stream.value = await navigator.mediaDevices.getUserMedia(constraints.value);
});

const updateVideoMuted = async (updatedMuted: boolean) => {
  console.log("updateVideoMuted", updatedMuted);
  if (videoMuted.value === updatedMuted) return;
  videoMuted.value = updatedMuted;
};
const updateAudioMuted = async (updatedMuted: boolean) => {
  console.log("updateAudioMuted", updatedMuted);
  if (audioMuted.value === updatedMuted) return;
  audioMuted.value = updatedMuted;
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
const handleUserInfoDialogClose = () => {
  userInfoDialogVisible.value = false;
};
const username = ref("");
const roomId = ref("");

const onStartCall = () => {
  if (!username.value || !roomId.value) {
    userInfoDialogVisible.value = true;
  }
};

const avatarURL = ref("");
</script>

<template>
  <div class="byte-meeting-main">
    <div class="byte-meeting-header">
      <div class="byte-meeting-title">Byte Meeting</div>
      <div class="byte-meeting-username">用户名: {{ username || "暂无" }}</div>
      <div class="byte-meeting-roomId">房间号: {{ roomId || "暂无" }}</div>
    </div>
    <div class="byte-meeting-content">
      <div class="byte-meeting-center">
        <div class="byte-meeting-avatars-container">
          <div class="byte-meeting-avatars">
            <AvatarCard
              :avatarURL="
                avatarURL ||
                'https://avatars.githubusercontent.com/u/24741764?v=4'
              "
              :username="username || '暂无用户名'"
              v-model="audioMuted"
              :src-object="stream || screenStream"
            />
            <AvatarCard
              v-for="(avatarCardProp, idx) in avatarCardProps"
              v-bind="avatarCardProp"
              v-bind:key="avatarCardProp.username"
              v-model="avatarCardMutedRefs[idx].value"
            />
          </div>
        </div>
        <div class="byte-meeting-actions">
          <VideoButton
            :videoDevices="videoDevices"
            :selectedVideoDeviceId="selectedVideoDeviceId"
            :muted="videoMuted"
            @update:muted="updateVideoMuted"
            @update:videoDevice="updateVideoDevice"
          />
          <AudioButton
            :audioDevices="audioDevices"
            :selectedAudioDeviceId="selectedAudioDeviceId"
            :muted="audioMuted"
            @update:muted="updateAudioMuted"
            @update:audioDevice="updateAudioDevice"
          />
          <div class="byte-meeting-action-container">
            <div
              :class="{
                'byte-meeting-action': true,
                muted: !screenStream,
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
                muted: !screenStream,
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
            v-for="participantCardProp in participantCardProps"
            v-bind="participantCardProp"
            v-bind:key="participantCardProp.username"
          />
        </div>
        <div class="byte-meeting-chat">
          <div class="byte-meeting-chat-messages"></div>
          <div class="byte-meeting-chat-inputbox">
            <InputBox
              v-model="message"
              @send:file="sendFile"
              @send:message="sendMessage"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="byte-meeting-footer"></div>
  </div>

  <el-dialog
    title="请输入用户信息"
    v-model="userInfoDialogVisible"
    width="30%"
    :before-close="handleUserInfoDialogClose"
  >
    <div class="input-line">
      <label class="input-label">用户名</label>
      <el-input placeholder="请输入用户名" v-model="username" clearable>
      </el-input>
    </div>
    <div class="input-line">
      <label class="input-label">房间号</label>
      <el-input placeholder="请输入房间号" v-model="roomId" clearable>
      </el-input>
    </div>
    <div class="input-line">
      <label class="input-label">头像 </label>
      <el-input placeholder="请输入头像地址" v-model="avatarURL" clearable>
      </el-input>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="userInfoDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="userInfoDialogVisible = false"
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
    &-container {
      overflow: auto;
      display: flex;
      flex-direction: column;
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
    &-messages {
      flex-grow: 1;
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
