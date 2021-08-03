import AvatarCard, { AvatarCardProps } from "./AvatarCard.vue";
import { Story } from "@storybook/vue3/types-6-0";
import { onMounted, ref } from "vue";

export default {
  title: "Components/AvatarCard",
  component: AvatarCard,
  argTypes: {},
};

// 支持异步生成的 props
// https://storybook.js.org/docs/vue/writing-stories/loaders
const Template: Story<AvatarCardProps> = (args) => ({
  // Components used in your story `template` are defined in the `components` object
  components: { AvatarCard },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup() {
    const stream = ref<MediaStream | null>(null);
    onMounted(async () => {
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log(stream.value);
    });
    console.log("args", args);
    const muted = ref(args.modelValue);
    return { args, stream, muted };
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template: '<avatar-card v-bind="args" :srcObject="stream" v-model="muted" />',
});

export const AvatarCardEx1 = Template.bind({});
AvatarCardEx1.args = {
  avatarURL: "https://avatars.githubusercontent.com/u/24741764?v=4",
  username: "Yiming Li",
  modelValue: false,
};
