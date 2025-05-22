<template>
  <div class="flex items-center gap-2">
    <NetworkIndicator :currentNetwork="currentNetwork" :isWrongNetwork="isWrongNetwork" />
    <ConnectMetamaskButton />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from "vue";

import ConnectMetamaskButton from "@/components/ConnectMetamaskButton.vue";
import NetworkIndicator from "@/components/prividium/NetworkIndicator.vue";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import useWallet from "@/composables/useWallet";

const context = useContext();
const { logout, isLoginPending } = useLogin(context);
const currentNetwork = computed(() => context.currentNetwork.value);

const { address, isReady, currentChainId } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: 0,
    ...context.currentNetwork.value,
  })),
});

const wasLoggedIn = ref(context.user.value.loggedIn);

const isWalletConnected = computed(() => !!address.value);

watchEffect(() => {
  if (isReady.value && wasLoggedIn.value && !context.user.value.loggedIn && !isLoginPending.value) {
    logout();
  }
  wasLoggedIn.value = context.user.value.loggedIn;
});

watch(isWalletConnected, (connected, wasConnected) => {
  if (isReady.value && wasConnected && !connected && context.user.value.loggedIn && !isLoginPending.value) {
    logout();
  }
});

const isWrongNetwork = computed(() => {
  if (currentChainId.value === null) return false;
  return currentChainId.value !== `0x${currentNetwork.value.l2ChainId.toString(16)}`;
});
</script>
