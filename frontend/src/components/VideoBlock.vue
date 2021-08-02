<template>
  <div class="video-block">
    <el-image
      :class="isActive ? 'video-active' : 'video-inactive'"
      :src="imgSrc"
      fit="cover"
    ></el-image>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

defineProps({
  isActive: {
    default: false,
  },
  imgSrc: {
    default: "",
  },
});
</script>

<style lang="less" scoped>
.el-image {
  width: 450px;
  height: 250px;
}

.video-block {
  margin: 0px 5px;
}

.video-active {
  border: 2px solid rgb(18, 219, 0);
  border-radius: 10px;
}

.video-inactive {
  border: 1px solid rgb(200, 200, 200);
  border-radius: 10px;
}
</style>
