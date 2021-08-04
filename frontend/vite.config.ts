import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:8005",
      "/socket.io": "http://localhost:8005",
    },
  },
  resolve: {
    // Less ~ alias https://github.com/vitejs/vite/issues/2185
    alias: [{ find: /^~/, replacement: "" }],
  },
});
