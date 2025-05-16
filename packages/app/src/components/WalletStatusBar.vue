<template>
  <div class="wallet-status-bar">
    <NetworkIndicator :currentNetwork="currentNetwork" :isWrongNetwork="isWrongNetwork" />
    <ConnectMetamaskButton />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";

import ConnectMetamaskButton from "@/components/ConnectMetamaskButton.vue";
import NetworkIndicator from "@/components/NetworkIndicator.vue";

import useContext from "@/composables/useContext";
import useLogin from "@/composables/useLogin";
import { default as useWallet } from "@/composables/useWallet";

const context = useContext();
const { logout } = useLogin(context);
const currentNetwork = computed(() => context.currentNetwork.value);

const { address, getEthereumProvider, isReady } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});

const currentChainId = ref<string | null>(null);

const handleChainChange = (chainId: string) => {
  currentChainId.value = chainId;
};

const updateChainId = async () => {
  const provider = await getEthereumProvider();
  if (provider && provider.chainId) {
    currentChainId.value = provider.chainId;
  } else {
    currentChainId.value = null;
  }
};

const setupChainListener = async () => {
  const provider = await getEthereumProvider();
  if (provider) {
    provider.on("chainChanged", handleChainChange);
  }
};

const cleanupChainListener = async () => {
  const provider = await getEthereumProvider();
  if (provider) {
    provider.removeListener("chainChanged", handleChainChange);
  }
};

onMounted(async () => {
  await updateChainId();
  await setupChainListener();
});

onUnmounted(async () => {
  await cleanupChainListener();
});

watchEffect(() => {
  if (isReady.value && !address.value) {
    logout();
  }
});

const isWrongNetwork = computed(() => {
  if (!currentChainId.value) return false;
  return currentChainId.value !== `0x${currentNetwork.value.l2ChainId.toString(16)}`;
});
</script>

<style scoped>
.wallet-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
