<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <div id="nav">
    <router-link to="/"> Home </router-link> |
    <router-link to="/about"> About </router-link> |
    <router-link to="/example"> Example </router-link>
  </div>
  <Suspense><router-view /></Suspense>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
});
</script>

<style lang="less">
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
