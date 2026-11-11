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

// Remove trailing slash from root route when deployed under a sub-path.
// Vue Router normalizes /explorer to /explorer/, but we want the address bar to show /explorer.
router.afterEach((to, _from, failure) => {
  if (failure || appBase === "/" || to.path !== "/") {
    return;
  }
  // appBase is the runtime base with trailing slash (e.g. "/explorer/").
  // Build the URL without the trailing slash for the root route.
  const baseWithoutSlash = appBase.replace(/\/+$/, "");
  const newUrl = baseWithoutSlash + (location.search || "") + (location.hash || "");
  // Use history.replaceState to update the URL without triggering a navigation.
  history.replaceState(history.state, "", newUrl);
});

export default router;
