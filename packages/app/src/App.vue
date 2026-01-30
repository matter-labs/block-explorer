<template>
  <!-- Loading screen during Prividium auth check (matches Prividium design) -->
  <div
    v-if="isPrividiumAuthChecking"
    class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12 sm:px-6 lg:px-8"
  >
    <img src="/images/prividium_logo.svg" alt="Prividium Logo" class="mb-6 h-16 w-auto" />
    <div class="text-center">
      <h1 class="mb-4 text-2xl font-semibold text-gray-900">Checking permissions...</h1>
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
    </div>
  </div>

  <!-- Main content -->
  <template v-else-if="isReady">
    <the-header v-if="!isPublicRoute" :class="route?.name" />
    <div
      :class="{
        'container-app': !isPublicRoute,
      }"
    >
      <IndexerDelayAlert v-if="!currentNetwork.maintenance && currentNetwork.name === 'mainnet'" />
      <MaintenanceView v-if="currentNetwork.maintenance" />
      <router-view v-else />
    </div>
    <the-footer v-if="!isPublicRoute" />
  </template>
</template>

<script setup lang="ts">
import { computed, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useTitle } from "@vueuse/core";

import usePublicRoutes from "./composables/usePublicRoutes";
import useRuntimeConfig from "./composables/useRuntimeConfig";
import useSkipLoginCheckRoutes from "./composables/useSkipLoginCheckRoutes";

import IndexerDelayAlert from "@/components/IndexerDelayAlert.vue";
import TheFooter from "@/components/TheFooter.vue";
import TheHeader from "@/components/header/TheHeader.vue";

import useContext from "@/composables/useContext";
import useLocalization from "@/composables/useLocalization";
import useLogin from "@/composables/useLogin";
import useRouteTitle from "@/composables/useRouteTitle";

import MaintenanceView from "@/views/MaintenanceView.vue";

const { setup } = useLocalization();
const { title } = useRouteTitle();
const context = useContext();
const route = useRoute();
const router = useRouter();
const { isPublicRoute } = usePublicRoutes();
const { isSkipLoginRoute } = useSkipLoginCheckRoutes();
const { initializeLogin } = useLogin(context);
const runtimeConfig = useRuntimeConfig();

useTitle(title);
const { isReady, currentNetwork } = useContext();

const isPrividiumAuthChecking = computed(() => {
  if (runtimeConfig.appEnvironment !== "prividium") return false;
  if (!isReady.value) return false;
  if (isPublicRoute.value) return false;
  return !context.user.value.loggedIn;
});

setup();

onBeforeMount(async () => {
  if (runtimeConfig.appEnvironment !== "prividium" || isSkipLoginRoute.value) {
    return;
  }

  await initializeLogin();

  if (context.user.value.loggedIn || isPublicRoute.value) {
    return;
  }

  return router.push({ name: "login", query: { redirect: route.fullPath } });
});
</script>

<style lang="scss">
.container-app {
  @apply container pt-6;
}
</style>
