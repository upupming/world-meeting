import AudioButton, { Props } from "./AudioButton.vue";
import { Story } from "@storybook/vue3/types-6-0";
import { onMounted, Ref, ref } from "vue";

export default {
  title: "Components/AudioButton",
  component: AudioButton,
  argTypes: {},
};

const Template: Story<Props> = () => ({
  // Components used in your story `template` are defined in the `components` object
  components: { AudioButton },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup() {
    const audioDevices: Ref<MediaDeviceInfo[]> = ref([]);
    const selectedAudioDeviceId = ref("");
    const muted = ref(false);
    onMounted(async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      audioDevices.value = devices;
      audioDevices.value = audioDevices.value.filter(
        (device) => device.kind == "audioinput"
      );
      selectedAudioDeviceId.value = audioDevices.value[0].deviceId;
      console.log("selectedAudioDeviceId.value", selectedAudioDeviceId.value);
    });

    const updateMuted = (updatedMuted: boolean) => {
      console.log("update:muted", updatedMuted);
      muted.value = updatedMuted;
    };
    const updateAudioDevice = (updatedAudioDevice: string) => {
      console.log("update:audioDevice", updatedAudioDevice);
      selectedAudioDeviceId.value = updatedAudioDevice;
    };

    return {
      audioDevices,
      muted,
      selectedAudioDeviceId,
      updateMuted,
      updateAudioDevice,
    };
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template:
    '<div style="margin-top: 300px;"><audio-button :audioDevices="audioDevices" :muted="muted" :selectedAudioDeviceId="selectedAudioDeviceId" @update:muted="updateMuted" @update:audioDevice="updateAudioDevice" /></div>',
});

export const AudioButtonEx1 = Template.bind({});
