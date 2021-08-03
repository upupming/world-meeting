<script setup lang="ts">
import { useVModel } from "@vueuse/core";

export interface Props {
  avatarURL: string;
  username: string;
  modelValue: boolean;
  srcObject?: MediaProvider;
}
const emit = defineEmits();
const props = defineProps<Props>();

const muted = useVModel(props, "modelValue", emit);
const micMute = () => {
  console.log(`mute mic`);
  muted.value = true;
};
const micUnmute = () => {
  console.log(`unmute mic`);
  muted.value = false;
  console.log(muted.value);
};
</script>

<template>
  <div
    class="avatar-card"
    :style="{
      backgroundImage: `url(${avatarURL})`,
    }"
  >
    <video
      :srcObject="srcObject"
      class="avatar-card-video"
      playsinline
      autoplay
      :muted="muted"
    ></video>
    <div class="avatar-card-username">
      <div class="avatar-card-username-text">{{ username }}</div>
    </div>
    <div v-if="muted" class="avatar-card-mic-status muted">
      <i
        @click="micUnmute"
        class="fas fa-microphone-slash avatar-card-mic-status-icon"
      ></i>
    </div>
    <div v-else class="avatar-card-mic-status unmuted">
      <i
        @click="micMute"
        class="fas fa-microphone avatar-card-mic-status-icon"
      ></i>
    </div>
  </div>
</template>

<style lang="less">
@import "../assets/less/common.less";

.avatar-card {
  width: 100%;
  height: 100%;
  position: relative;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: contain;
  background-color: @orange;
  border-radius: 30px;

  &-video {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }

  &-username {
    position: absolute;
    left: 20px;
    bottom: 20px;
    padding: 10px;
    border-radius: 5px;
    background-color: fade(@current-line, 40%);
  }

  &-mic-status {
    cursor: pointer;
    padding: 10px 15px;
    border-radius: 5px;
    position: absolute;
    right: 20px;
    bottom: 20px;
    background-color: fade(@current-line, 40%);
    display: flex;
    justify-content: center;
    align-items: center;
    &:hover {
      background-color: fade(@current-line, 60%);
    }

    &.muted {
      background-color: @red;
    }

    &-icon {
      width: 32px;
      text-align: center;
      font-size: 25px;
    }
  }
}
</style>
