<template>
  <template v-if="isReady">
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
import { onBeforeMount } from "vue";
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
#app {
  background: url("/the-correct-background.webp") no-repeat center center fixed;
  background-size: cover;
}
.container-app {
  @apply container pt-6;
}
</style>
