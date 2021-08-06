import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:8005",
      "/socket.io": "http://localhost:8005",
    },
    // https://dev.to/web2033/vite-enabling-https-on-localhost-2ckf
    https: {
      key: fs.readFileSync("world-meeting.com-key.pem"),
      cert: fs.readFileSync("world-meeting.com.pem"),
    },
  },
  resolve: {
    // Less ~ alias https://github.com/vitejs/vite/issues/2185
    alias: [{ find: /^~/, replacement: "" }],
  },
});
