import VideoButton, { Props } from "./VideoButton.vue";
import { Story } from "@storybook/vue3/types-6-0";
import { onMounted, Ref, ref } from "vue";

export default {
  title: "Components/VideoButton",
  component: VideoButton,
  argTypes: {},
};

const Template: Story<Props> = () => ({
  // Components used in your story `template` are defined in the `components` object
  components: { VideoButton },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup() {
    const videoDevices: Ref<MediaDeviceInfo[]> = ref([]);
    const selectedVideoDeviceId = ref("");
    const muted = ref(false);
    onMounted(async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      videoDevices.value = devices;
      videoDevices.value = videoDevices.value.filter(
        (device) => device.kind == "videoinput"
      );
      selectedVideoDeviceId.value = videoDevices.value[0].deviceId;
      console.log("selectedVideoDeviceId.value", selectedVideoDeviceId.value);
    });

    const updateMuted = (updatedMuted: boolean) => {
      console.log("update:muted", updatedMuted);
      muted.value = updatedMuted;
    };
    const updateVideoDevice = (updatedVideoDevice: string) => {
      console.log("update:videoDevice", updatedVideoDevice);
      selectedVideoDeviceId.value = updatedVideoDevice;
    };

    return {
      videoDevices,
      muted,
      selectedVideoDeviceId,
      updateMuted,
      updateVideoDevice,
    };
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template:
    '<div style="margin-top: 300px;"><video-button :videoDevices="videoDevices" :muted="muted" :selectedVideoDeviceId="selectedVideoDeviceId" @update:muted="updateMuted" @update:videoDevice="updateVideoDevice" /></div>',
});

export const VideoButtonEx1 = Template.bind({});
