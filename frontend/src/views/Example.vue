<template>
  <div>Exmaple</div>
  <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
  <el-pagination background layout="prev, pager, next" :total="1000">
  </el-pagination>
  <br />
  <el-button type="primary" round> changeLanguage </el-button>
</template>

<script setup lang="ts">
import HelloWorld from "../components/HelloWorld.vue";
import { onMounted } from "vue";

onMounted(() => {
  console.log("Hello Example");
});
</script>

<style scoped></style>
