<template>
  <div>Home</div>
  <div>Message from /api/test:</div>
  <pre>{{ JSON.stringify(testRes, null, 2) }}</pre>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import axios from "axios";

onMounted(() => {
  console.log("Hello Index");
});
const testRes = await axios.get("/api/test");
console.log(testRes);
</script>

<style scoped></style>
