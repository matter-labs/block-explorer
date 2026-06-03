import { createRouter, createWebHistory } from "vue-router";

import routes from "./routes";

import useContext from "@/composables/useContext";
import useRuntimeConfig from "@/composables/useRuntimeConfig";

const router = createRouter({
  // With no base argument vue-router reads the <base> tag, which covers both
  // build-time (VITE_BASE_PATH) and runtime (BASE_PATH env var) configuration.
  history: createWebHistory(),
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
