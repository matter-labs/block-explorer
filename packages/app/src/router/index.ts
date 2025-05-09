import { createRouter, createWebHistory } from "vue-router";

import routes from "./routes";

import useContext from "@/composables/useContext";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const context = useContext();

  if (to.meta.requiresAuth === false) {
    next();
    return;
  }

  if (!context.user.value.loggedIn) {
    next({
      name: "login",
      query: { redirect: to.fullPath },
    });
    return;
  }

  next();
});

export default router;
