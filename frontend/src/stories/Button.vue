<template>
  <button type="button" :class="classes" @click="onClick" :style="style">
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import "./button.css";
import { computed, defineProps, defineEmits, withDefaults } from "vue";

export interface Props {
  label: string;
  primary?: boolean;
  size?: string;
  backgroundColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  primary: false,
});

const emit = defineEmits(["click"]);

const classes = computed(() => ({
  "storybook-button": true,
  "storybook-button--primary": props.primary,
  "storybook-button--secondary": !props.primary,
  [`storybook-button--${props.size || "medium"}`]: true,
}));

const style = computed(() => ({
  backgroundColor: props.backgroundColor,
}));

const onClick = () => {
  emit("click");
};
</script>
