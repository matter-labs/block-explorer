<template>
  <div :class="['network-status', { 'wrong-network': isConnectedWrongNetwork }]">
    <template v-if="isConnectedWrongNetwork">
      <span class="wrong-network-text">Wrong network</span>
    </template>
    <template v-else>
      <span class="network-item">
        <img
          :src="context.currentNetwork.value.icon"
          :alt="`${context.currentNetwork.value.l2NetworkName} logo`"
          class="network-item-img"
        />
        <span class="network-item-label">{{ context.currentNetwork.value.l2NetworkName }}</span>
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import useContext from "@/composables/useContext";
import useWallet from "@/composables/useWallet";

const context = useContext();
const { isConnectedWrongNetwork } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: 0,
    ...context.currentNetwork.value,
  })),
});
</script>

<style scoped lang="scss">
.network-status {
  @apply flex items-center justify-center gap-1 rounded-md border border-neutral-300 bg-white px-4 py-0.5 font-sans text-sm text-neutral-700;
  min-width: 120px;
  white-space: nowrap;
  height: 42px;
  .network-item {
    @apply flex items-center gap-0.5;
    .network-item-img {
      @apply h-3 w-3 flex-shrink-0;
    }
    .network-item-label {
      @apply block truncate text-base;
      line-height: 1.1;
    }
  }
  .warning-icon {
    @apply mr-1;
    font-size: 0.9em;
    line-height: 1;
  }
  .wrong-network-text {
    @apply font-sans text-sm leading-5 text-neutral-700;
  }
}
.wrong-network {
  background: #ffc81a;
  border-color: #ffc81a;
}
</style>
