<script setup lang="ts">
import AvatarCard from "../components/AvatarCard.vue";
import type { AvatarCardProps } from "../components/AvatarCard.vue";
import ParticipantCard from "../components/ParticipantCard.vue";
import type { ParticipantCardProps } from "../components/ParticipantCard.vue";

import { ref } from "vue";
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
];
const avatarCardMutedRefs = [false, true, false, false, true].map((muted) =>
  ref(muted)
);

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
</script>

<template>
  <div class="byte-meeting">
    <div class="byte-meeting-sidebar"></div>
    <div class="byte-meeting-main">
      <div class="byte-meeting-header">
        <div class="byte-meeting-title">Byte Meeting</div>
      </div>
      <div class="byte-meeting-content">
        <div class="byte-meeting-avatars">
          <AvatarCard
            v-for="(avatarCardProp, idx) in avatarCardProps"
            v-bind="avatarCardProp"
            v-bind:key="avatarCardProp.username"
            v-model="avatarCardMutedRefs[idx].value"
          />
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
  </div>
</template>

<style scoped lang="less">
@import "../assets/less/common.less";

.byte-meeting {
  width: 100%;
  height: 100%;

  font-size: 20px;
  display: flex;
  flex-direction: row;
  &-sidebar {
    width: 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 5px 10px 0 rgb(0 0 0 / 15%);
    background-color: @selection;
  }
  &-main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  &-header {
    height: 64px;
    width: 100%;
    display: flex;
    align-items: center;
    box-shadow: 0 5px 10px 0 rgb(0 0 0 / 15%);
  }
  &-title {
    font-family: "Abril Text";
    padding-left: 12px;
    font-size: 32px;
  }
  &-content {
    width: 100%;
    flex-grow: 1;
    display: flex;
  }
  &-avatars {
    display: grid;
    width: 70%;
    grid-template-columns: auto auto auto;
    grid-auto-rows: 240px;
    padding: 10px;
    grid-row-gap: 20px;
    grid-column-gap: 20px;
  }
  &-right {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  &-participants {
    height: 50%;
    overflow: scroll;
    box-shadow: 0 5px 10px 0 rgb(0 0 0 / 15%);
  }
  &-chat {
    height: 50%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    &-messages {
      flex-grow: 1;
    }
    &-inputbox {
      margin-bottom: 30px;
    }
    box-shadow: 10px 5px 10px 10px rgb(0 0 0 / 15%);
  }
}
</style>
