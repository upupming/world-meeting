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
// export default {
//   name: "my-button",

//   props: {
//     label: {
//       type: String,
//       required: true,
//     },
//     primary: {
//       type: Boolean,
//       default: false,
//     },
//     size: {
//       type: String,
//       validator: function (value: string): boolean {
//         return ["small", "medium", "large"].indexOf(value) !== -1;
//       },
//     },
//     backgroundColor: {
//       type: String,
//     },
//   },

//   emits: ["click"],

//   setup(props, { emit }) {
//     props = reactive(props);
//     return {
//       classes: computed(() => ({
//         "storybook-button": true,
//         "storybook-button--primary": props.primary,
//         "storybook-button--secondary": !props.primary,
//         [`storybook-button--${props.size || "medium"}`]: true,
//       })),
//       style: computed(() => ({
//         backgroundColor: props.backgroundColor,
//       })),
//       onClick() {
//         emit("click");
//       },
//     };
//   },
// };
</script>
