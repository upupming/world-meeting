<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { ref } from "vue";
export interface Props {
  modelValue: string;
}
const emit = defineEmits<{
  (e: "send:file", file: File): void;
  (e: "send:message", message: string): void;
}>();

const props = defineProps<Props>();

const message = useVModel(props, "modelValue", emit);
const uploader = ref<HTMLInputElement | null>(null);
const filename = ref<string | undefined>(undefined);
const onChange = () => {
  console.log(uploader.value?.files);
  filename.value = uploader.value?.files?.[0]?.name;
};
const onSend = () => {
  const file = uploader.value?.files?.[0];
  if (file) {
    emit("send:file", file);
    onClearFile();
  }
  if (message.value) {
    emit("send:message", message.value);
    message.value = "";
  }
};
const onClearFile = () => {
  if (uploader.value?.value) {
    uploader.value.value = "";
    filename.value = undefined;
  }
};
</script>

<template>
  <div class="input-box-filename" v-if="filename">
    {{ filename }}
    <i class="fas fa-minus clear-file" @click="onClearFile"></i>
  </div>
  <div class="input-box">
    <div class="input-box-action-icons">
      <label for="input-box-action-icons-upload" :title="filename">
        <i class="fas fa-file"></i>
      </label>
      <input
        accept="*/*"
        id="input-box-action-icons-upload"
        @change="onChange"
        type="file"
        ref="uploader"
      />
    </div>
    <div class="input-box-form">
      <div class="input-box-form-input">
        <input type="text" v-model="message" />
      </div>
      <div
        :class="{
          'input-box-form-send': true,
          disabled: message.length === 0 && filename === undefined,
        }"
      >
        <button @click="onSend">发送</button>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import "../assets/less/common.less";

.clear-file {
  padding-left: 12px;
  cursor: pointer;
}

.input-box {
  font-size: 32px;
  box-sizing: border-box;
  padding: 0 16px;
  width: 100%;
  height: 64px;
  display: flex;
  align-items: center;

  &-filename {
    padding: 4px 16px;
  }

  &-action-icons {
    label {
      cursor: pointer;
      &:hover {
        color: lighten(@current-line, 60%);
      }
    }
    #input-box-action-icons-upload {
      display: none;
    }
  }

  &-form {
    flex-grow: 1;
    display: flex;
    height: 100%;
    align-items: center;

    &-input {
      padding: 0 10px;
      flex-grow: 1;
      height: 100%;
      display: flex;
      align-items: center;
      input {
        height: 100%;
        flex-grow: 1;
        font-size: 20px;
        padding: 0 24px;
        border-radius: 48px;
        border: none;
        outline: none;
      }
    }

    &-send {
      display: flex;
      height: 100%;
      button {
        cursor: pointer;
        color: @background;
        background-color: @green;
        border: none;
        border-radius: 24px;
        height: 100%;
        width: 128px;
        font-size: 20px;
        padding: 10px;
      }
      &.disabled {
        button {
          background-color: fade(@green, 50%);
          color: fade(@background, 50%);
        }
      }
    }
  }
}
</style>
