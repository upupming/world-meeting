import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Index",
    component: () => import("../views/WorldMeeting.vue"),
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/About.vue"),
  },
  {
    path: "/example",
    name: "Example",
    component: () => import("../views/Example.vue"),
  },
  {
    path: "/room",
    name: "Room",
    component: () => import("../views/Room.vue"),
  },
  {
    path: "/world-meeting",
    name: "WorldMeeting",
    component: () => import("../views/WorldMeeting.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// router.beforeEach((to, from, next) => {
// 	next()
// })

export default router;
