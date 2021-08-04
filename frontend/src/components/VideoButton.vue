<script setup lang="ts">
export interface Props {
  videoDevices: MediaDeviceInfo[];
  selectedVideoDeviceId: string;
  muted: boolean;
}
defineProps<Props>();
const emit = defineEmits<{
  (e: "update:videoDevice", deviceId: string): void;
  (e: "update:muted", muted: boolean): void;
}>();

const micMute = () => {
  emit("update:muted", true);
};
const micUnmute = () => {
  emit("update:muted", false);
};
const updateVideoDevice = (deviceId: string) => {
  emit("update:videoDevice", deviceId);
};
</script>

<template>
  <div class="dropdown">
    <div
      :class="{
        'video-button': true,
        muted: muted,
      }"
    >
      <div v-if="muted" class="video-button-status">
        <i
          @click="micUnmute"
          class="fas fa-video-slash video-button-status-icon"
        ></i>
      </div>
      <div v-else class="video-button-status">
        <i @click="micMute" class="fas fa-video video-button-status-icon"></i>
      </div>
    </div>
    <div class="dropdown-content">
      <label
        v-for="device in videoDevices"
        class="container"
        :key="device.deviceId"
      >
        {{ device.label }}
        <input
          type="radio"
          :data-checked="selectedVideoDeviceId === device.deviceId"
          @change="updateVideoDevice(device.deviceId)"
          name="radio"
        />
        <span class="checkmark"></span>
      </label>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "../assets/less/common.less";

.video-button {
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
  }

  &-status {
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
