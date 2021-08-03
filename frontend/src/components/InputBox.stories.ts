import InputBox from "./InputBox.vue";
import { app } from "@storybook/vue3";
import { Story } from "@storybook/vue3/types-6-0";
import { ref } from "vue";
import ElementPlus from "element-plus";
import "element-plus/lib/theme-chalk/index.css";

app.use(ElementPlus);
export default {
  title: "Components/InputBox",
  component: InputBox,
  argTypes: {},
};

// 支持异步生成的 props
// https://storybook.js.org/docs/vue/writing-stories/loaders
const Template: Story = () => ({
  // Components used in your story `template` are defined in the `components` object
  components: { InputBox },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup() {
    const message = ref("");
    const sendMessage = (message: string) => {
      console.log("sendMessage", message);
    };
    const sendFile = (file: File) => {
      console.log("sendFile", file);
    };
    return {
      message,
      sendMessage,
      sendFile,
    };
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template: `<input-box v-model='message'
              @send:file='sendFile'
              @send:message='sendMessage' />`,
});

export const InputBoxEx1 = Template.bind({});
