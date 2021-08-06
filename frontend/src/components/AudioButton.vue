<script setup lang="ts">
import { onBeforeUpdate, ref } from "vue";

export interface Props {
  audioDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string;
  muted: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:audioDevice", deviceId: string): void;
  (e: "update:muted", muted: boolean): void;
}>();

const micMute = () => {
  emit("update:muted", true);
};
const micUnmute = () => {
  emit("update:muted", false);
};
const updateAudioDevice = (deviceId: string) => {
  emit("update:audioDevice", deviceId);
};
</script>

<template>
  <div class="dropdown">
    <div
      :class="{
        'audio-button': true,
        muted: muted,
      }"
    >
      <div v-if="muted" class="audio-button-mic-status">
        <i
          @click="micUnmute"
          class="fas fa-microphone-slash audio-button-mic-status-icon"
        ></i>
      </div>
      <div v-else class="audio-button-mic-status">
        <i
          @click="micMute"
          class="fas fa-microphone audio-button-mic-status-icon"
        ></i>
      </div>
    </div>
    <div class="dropdown-content">
      <label
        v-for="device in audioDevices"
        class="container"
        :key="device.deviceId"
      >
        {{ device.label }}
        <input
          type="radio"
          :data-checked="selectedAudioDeviceId === device.deviceId"
          @change="updateAudioDevice(device.deviceId)"
          name="radio"
        />
        <span class="checkmark"></span>
      </label>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "../assets/less/common.less";

.audio-button {
  position: relative;
  background-color: lighten(@current-line, 10%);
  border-radius: 10px;
  cursor: pointer;
  width: 72px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    background-color: lighten(@current-line, 20%);
  }
  &.muted {
    background-color: @red;
    &:hover {
      background-color: lighten(@red, 20%);
    }
  }

  &-mic-status {
    padding: 10px 15px;
    display: flex;
    justify-content: center;
    align-items: center;

    &-icon {
      width: 32px;
      text-align: center;
      font-size: 25px;
    }
  }
}
</style>
