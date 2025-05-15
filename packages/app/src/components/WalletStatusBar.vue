<template>
  <div class="wallet-status-bar">
    <NetworkIndicator :currentNetwork="currentNetwork" :isWrongNetwork="isWrongNetwork" />
    <ConnectMetamaskButton />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import ConnectMetamaskButton from "@/components/ConnectMetamaskButton.vue";
import NetworkIndicator from "@/components/NetworkIndicator.vue";

import useContext from "@/composables/useContext";
import useWallet from "@/composables/useWallet";

const context = useContext();
const currentNetwork = computed(() => context.currentNetwork.value);

const { address, getEthereumProvider } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});

const currentChainId = ref<string | null>(null);

const updateChainId = async () => {
  const provider = await getEthereumProvider();
  if (provider) {
    currentChainId.value = provider.chainId;
  }
};

watch(
  () => address.value,
  async () => {
    if (address.value) {
      await updateChainId();
    } else {
      currentChainId.value = null;
    }
  }
);

if (address.value) {
  updateChainId();
}

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
