<template>
  <template v-if="isReady">
    <the-header
      v-if="!['login', 'reviewing-permissions', 'not-authorized'].includes(String($route.name || ''))"
      :class="$route?.name"
    />
    <div
      :class="{
        'container-app': !['login', 'reviewing-permissions', 'not-authorized'].includes(String($route.name || '')),
      }"
    >
      <IndexerDelayAlert v-if="!currentNetwork.maintenance && currentNetwork.name === 'mainnet'" />
      <MaintenanceView v-if="currentNetwork.maintenance" />
      <router-view v-else />
    </div>
    <the-footer v-if="!['login', 'reviewing-permissions', 'not-authorized'].includes(String($route.name || ''))" />
  </template>
</template>

<script setup lang="ts">
import { useTitle } from "@vueuse/core";

import IndexerDelayAlert from "@/components/IndexerDelayAlert.vue";
import TheFooter from "@/components/TheFooter.vue";
import TheHeader from "@/components/header/TheHeader.vue";

import useContext from "@/composables/useContext";
import useLocalization from "@/composables/useLocalization";
import useRouteTitle from "@/composables/useRouteTitle";

import MaintenanceView from "@/views/MaintenanceView.vue";

const { setup } = useLocalization();
const { title } = useRouteTitle();

useTitle(title);
const { isReady, currentNetwork } = useContext();

setup();
</script>

<style lang="scss">
.container-app {
  @apply container pt-6;
}
</style>
