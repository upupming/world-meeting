import MyButton, { Props } from "./Button.vue";
import { Story, Meta } from "@storybook/vue3/types-6-0";

export default {
  title: "Example/Button",
  component: MyButton,
  argTypes: {
    backgroundColor: { control: "color" },
    size: {
      control: { type: "select", options: ["small", "medium", "large"] },
    },
    onClick: {},
  },
};

const Template: Story<Props> = (args) => ({
  // Components used in your story `template` are defined in the `components` object
  components: { MyButton },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup() {
    return { args };
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template: '<my-button v-bind="args" />',
});

export const Primary = Template.bind({});
Primary.args = {
  primary: true,
  label: "Button",
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: "Button",
};

export const Large = Template.bind({});
Large.args = {
  size: "large",
  label: "Button",
};

export const Small = Template.bind({});
Small.args = {
  size: "small",
  label: "Button",
};
