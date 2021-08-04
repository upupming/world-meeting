<script setup lang="ts">
export interface ParticipantCardProps {
  avatarURL: string;
  username: string;
  audioMuted: boolean;
  videoMuted: boolean;
}
const props = defineProps<ParticipantCardProps>();
const emit = defineEmits<{
  (e: "update:audioMuted", muted: boolean): void;
  (e: "update:videoMuted", muted: boolean): void;
}>();
</script>

<template>
  <div class="participant-card">
    <div
      class="participant-card-avatar"
      :style="{
        backgroundImage: `url(${avatarURL})`,
      }"
    ></div>
    <div class="participant-card-name">{{ username }}</div>
    <div class="participant-card-icons">
      <div
        :class="{
          'participant-card-icon-mic': true,
          muted: audioMuted,
        }"
      >
        <div v-if="audioMuted" class="audio-button-mic-status">
          <i
            @click="emit('update:audioMuted', false)"
            class="fas fa-microphone-slash audio-button-mic-status-icon"
          ></i>
        </div>
        <div v-else class="audio-button-mic-status">
          <i
            @click="emit('update:audioMuted', true)"
            class="fas fa-microphone audio-button-mic-status-icon"
          ></i>
        </div>
      </div>
      <div
        :class="{
          'participant-card-icon-video': true,
          muted: videoMuted,
        }"
      >
        <div v-if="videoMuted" class="video-button-status">
          <i
            @click="emit('update:videoMuted', false)"
            class="fas fa-video-slash video-button-status-icon"
          ></i>
        </div>
        <div v-else class="video-button-status">
          <i
            @click="emit('update:videoMuted', true)"
            class="fas fa-video video-button-status-icon"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "../assets/less/common.less";

.participant-card {
  padding: 10px;
  height: 64px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 24px;
  &:hover {
    background: @selection;
  }
  &-avatar {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: contain;
  }
  &-icons {
    display: flex;

    .muted {
      color: @red;
    }
  }

  .audio-button-mic-status {
    cursor: pointer;
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
  .video-button-status {
    cursor: pointer;
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
