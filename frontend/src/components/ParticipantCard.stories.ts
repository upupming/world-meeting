import ParticipantCard, { Props } from "./ParticipantCard.vue";
import { Story } from "@storybook/vue3/types-6-0";
import { ref } from "vue";

export default {
  title: "Components/ParticipantCard",
  component: ParticipantCard,
  argTypes: {},
};

const Template: Story<Props> = () => ({
  // Components used in your story `template` are defined in the `components` object
  components: { ParticipantCard },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup() {
    const audioMuted = ref(true);
    const videoMuted = ref(true);
    const updateAudioMuted = (updatedAudioMuted: boolean) => {
      console.log("update:audioMuted", updatedAudioMuted);
      audioMuted.value = updatedAudioMuted;
    };
    const updateVideoMuted = (updatedVideoMuted: boolean) => {
      console.log("update:videoMuted", updatedVideoMuted);
      videoMuted.value = updatedVideoMuted;
    };

    return { audioMuted, videoMuted, updateAudioMuted, updateVideoMuted };
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template: `<participant-card
            :audioMuted='audioMuted'
            :videoMuted='videoMuted' @update:audioMuted='updateAudioMuted'
            @update:videoMuted='updateVideoMuted'  />`,
});

export const ParticipantCardEx1 = Template.bind({});
