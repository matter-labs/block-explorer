<template v-if="newNetworkUrl">
  <SystemAlert>
    <span
      >We are ending our support of Goerli testnet. Please <a :href="newNetworkUrl!">use Sepolia</a>. For more info see
      <a target="_blank" href="https://github.com/zkSync-Community-Hub/zksync-developers/discussions/228"
        >this announcement</a
      >.</span
    >
  </SystemAlert>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import SystemAlert from "@/components/common/SystemAlert.vue";

import useContext from "@/composables/useContext";

import { getWindowLocation } from "@/utils/helpers";

const route = useRoute();
const { networks } = useContext();

const newNetworkUrl = computed(() => {
  const network = networks.value?.find((network) => network.name === "sepolia");
  if (network) {
    const { hostname, origin } = getWindowLocation();

    if (hostname === "localhost" || hostname.endsWith("web.app") || !network.hostnames?.length) {
      console.log(route);
      return `${origin}?network=${network.name}`;
    }
    return network.hostnames[0];
  }
  return null;
});
</script>

<style scoped lang="scss">
a {
  @apply text-inherit;
}
</style>
