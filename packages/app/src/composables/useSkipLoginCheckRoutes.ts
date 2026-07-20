// Created to centralize public routes logic across the application
// Updated to fix type error by properly typing the route path
import { computed } from "vue";
import { useRoute } from "vue-router";

import type { SkipLoginCheckRoutePath } from "@/utils/skip-login-check-routes";

import { SKIP_LOGIN_CHECK_ROUTES } from "@/utils/skip-login-check-routes";

export default () => {
  const route = useRoute();
  const isSkipLoginRoute = computed(() => SKIP_LOGIN_CHECK_ROUTES.includes(route.path as SkipLoginCheckRoutePath));

  return {
    isSkipLoginRoute,
  };
};
