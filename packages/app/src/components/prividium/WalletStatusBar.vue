<template>
  <div class="flex items-center gap-2">
    <NetworkIndicator />
    <WalletButton />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";

import NetworkIndicator from "@/components/prividium/NetworkIndicator.vue";
import WalletButton from "@/components/prividium/WalletButton.vue";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import useWallet, { isAuthenticated } from "@/composables/useWallet";

const context = useContext();
const { logout } = useLogin(context);

const { isReady } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: 0,
    ...context.currentNetwork.value,
  })),
});

watch(
  isAuthenticated,
  () => {
    if (isReady.value && !isAuthenticated.value) {
      logout();
    }
  },
  { immediate: true }
);
</script>
