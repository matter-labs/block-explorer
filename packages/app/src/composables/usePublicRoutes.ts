// Created to centralize public routes logic across the application
// Updated to fix type error by properly typing the route path
import { computed } from "vue";
import { useRoute } from "vue-router";

import { PUBLIC_ROUTES, type PublicRoutePath } from "@/utils/public-routes";

export default () => {
  const route = useRoute();

  const isPublicRoute = computed(() => PUBLIC_ROUTES.includes(route.path as PublicRoutePath));

  return {
    isPublicRoute,
    PUBLIC_ROUTES,
  };
};
