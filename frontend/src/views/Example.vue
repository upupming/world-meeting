<template>
  <div>Exmaple</div>
  <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
</template>

<script setup lang="ts">
import HelloWorld from "../components/HelloWorld.vue";
import { onMounted } from "vue";

onMounted(() => {
  console.log("Hello Example");
});
</script>

<style scoped></style>
