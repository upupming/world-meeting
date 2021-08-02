import { createApp } from "vue";
import router from "./router";
import App from "./App.vue";

import ElementPlus from "element-plus";
import "element-plus/lib/theme-chalk/index.css";

const app = createApp(App);

app.use(router);
app.use(ElementPlus, { size: "mini" });
app.mount("#app");
