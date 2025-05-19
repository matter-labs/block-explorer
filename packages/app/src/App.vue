<template>
  <template v-if="isReady">
    <the-header v-if="!PUBLIC_ROUTES.includes($route.path)" :class="$route?.name" />
    <div
      :class="{
        'container-app': !PUBLIC_ROUTES.includes($route.path),
      }"
    >
      <IndexerDelayAlert v-if="!currentNetwork.maintenance && currentNetwork.name === 'mainnet'" />
      <MaintenanceView v-if="currentNetwork.maintenance" />
      <router-view v-else />
    </div>
    <the-footer v-if="!PUBLIC_ROUTES.includes($route.path)" />
  </template>
</template>

<script setup lang="ts">
import { watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useTitle } from "@vueuse/core";

import useEnvironmentConfig from "./composables/useEnvironmentConfig";
import { PUBLIC_ROUTES } from "./utils/public-routes";

import IndexerDelayAlert from "@/components/IndexerDelayAlert.vue";
import TheFooter from "@/components/TheFooter.vue";
import TheHeader from "@/components/header/TheHeader.vue";

import useContext from "@/composables/useContext";
import useLocalization from "@/composables/useLocalization";
import useRouteTitle from "@/composables/useRouteTitle";

import MaintenanceView from "@/views/MaintenanceView.vue";

const { setup } = useLocalization();
const { title } = useRouteTitle();
const context = useContext();
const { prividium } = useEnvironmentConfig();
const route = useRoute();
const router = useRouter();

useTitle(title);
const { isReady, currentNetwork } = useContext();

setup();

watchEffect(() => {
  if (!prividium.value) {
    return;
  }

  if (!context.user.value.loggedIn && !PUBLIC_ROUTES.includes(route.path)) {
    return router.push({ name: "login", query: { redirect: route.fullPath } });
  }
});
</script>

<style lang="scss">
.container-app {
  @apply container pt-6;
}
</style>
