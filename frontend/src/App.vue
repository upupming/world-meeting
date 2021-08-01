<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <div id="nav">
    <router-link to="/"> Home </router-link> |
    <router-link to="/about"> About </router-link> |
    <router-link to="/example"> Example </router-link>
  </div>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
});
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
