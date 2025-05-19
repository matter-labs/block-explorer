<template>
  <div :class="['network-status', { 'wrong-network': isWrongNetwork }]">
    <template v-if="isWrongNetwork">
      <span class="wrong-network-text">Wrong network</span>
    </template>
    <template v-else>
      <span class="network-item">
        <img :src="currentNetwork.icon" :alt="`${currentNetwork.l2NetworkName} logo`" class="network-item-img" />
        <span class="network-item-label">{{ currentNetwork.l2NetworkName }}</span>
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

import type { NetworkConfig } from "@/configs";

defineProps<{
  currentNetwork: NetworkConfig;
  isWrongNetwork: boolean;
}>();
</script>

<style scoped lang="scss">
.network-status {
  @apply flex items-center justify-center gap-1 px-4 py-0.5 rounded-md border border-neutral-300 bg-white font-sans text-sm text-neutral-700;
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
