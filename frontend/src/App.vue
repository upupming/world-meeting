<template>
  <div class="world-meeting">
    <div class="world-meeting-sidebar">
      <router-link to="/world-meeting">
        <i class="fas fa-home"></i>
      </router-link>
      <router-link to="/about">
        <i class="fas fa-chart-pie"></i>
      </router-link>
    </div>
    <Suspense><router-view /></Suspense>
  </div>
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
.world-meeting {
  font-family: "Times New Roman", serif, "Helvetica Neue", Helvetica, Arial,
    sans-serif;
  width: 100%;
  height: 100%;

  font-size: 20px;
  display: flex;
  flex-direction: row;
  &-sidebar {
    width: 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 5px 10px 0 rgb(0 0 0 / 15%);
    background-color: @outer-color;
    border-right: 1px solid fade(@current-line, 10%);

    a {
      padding: 12px;
      color: @foreground;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        color: fade(@foreground, 70%);
      }
      i {
        font-size: 32px;
      }
    }
  }
}
</style>
