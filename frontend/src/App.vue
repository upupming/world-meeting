<template>
  <Suspense><router-view /></Suspense>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
});
</script>

<style lang="less">
@import "./assets/less/common.less";

html,
body,
#app,
.el-container {
  padding: 0px;
  margin: 0px;
  height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
