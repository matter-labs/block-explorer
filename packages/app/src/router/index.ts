import { createRouter, createWebHistory } from "vue-router";

import routes from "./routes";

import useContext from "@/composables/useContext";
import useRuntimeConfig from "@/composables/useRuntimeConfig";

import { appBase } from "@/utils/appBase";

const router = createRouter({
  // Not import.meta.env.BASE_URL: that is Vite's `base`, which is used as the asset placeholder.
  // The router base must be the runtime app base (window.__APP_BASE__).
  history: createWebHistory(appBase),
  routes,
});

router.beforeEach((to) => {
  const runtimeConfig = useRuntimeConfig();
  const isPrividium = runtimeConfig.appEnvironment === "prividium";

  if (isPrividium && to.meta.requiresAdmin) {
    const { user } = useContext();
    const hasAdminRead = user.value.loggedIn && user.value.hasAdminRead;
    if (!hasAdminRead) {
      return { name: "not-authorized" };
    }
  }
});

export default router;
