<template>
  <SystemAlert v-if="isIndexerDelayed">
    <span
      v-if="latestTPS > MIN_TPS_TO_SHOW_HEAVY_LOAD_ALERT"
      v-html="t('systemAlert.indexerDelayedDueToHeavyLoad', { indexerDelayInHours })"
    />
    <span v-else v-html="t('systemAlert.indexerDelayed', { indexerDelayInHours })" />
  </SystemAlert>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import SystemAlert from "@/components/common/SystemAlert.vue";

import useBlocks from "@/composables/useBlocks";
import useContext from "@/composables/useContext";

import type { types } from "zksync-ethers";

const { t } = useI18n();
const context = useContext();

const MIN_DELAY_TO_SHOW_ALERT = 900_000; // 15 mins
const MIN_TPS_TO_SHOW_HEAVY_LOAD_ALERT = 70;

const provider = context.getL2Provider();
const latestBlock = ref<types.Block | null>(null);
(async () => {
  const block = await provider.getBlock("latest");
  latestBlock.value = block;
})();

const { load: getLatestIndexedBlocks, data: latestIndexedBlocks } = useBlocks(context);
getLatestIndexedBlocks(1);

const indexerDelay = computed(() => {
  if (!latestBlock.value?.number || !latestIndexedBlocks.value?.length) {
    return 0;
  }
  const latestBlockDate = new Date(latestBlock.value.timestamp * 1000);
  const latestIndexedBlockDate = new Date(latestIndexedBlocks.value[0].timestamp);
  const delay = latestBlockDate.getTime() - latestIndexedBlockDate.getTime();
  return delay;
});

const indexerDelayInHours = computed(() => (indexerDelay.value / (1000 * 60 * 60)).toFixed(1));

const isIndexerDelayed = computed(() => {
  if (indexerDelay.value > MIN_DELAY_TO_SHOW_ALERT) {
    return true;
  }
  return false;
});

const latestTPS = computed(() => {
  if (!latestIndexedBlocks.value?.length) {
    return 0;
  }
  const numberOfTransactions = latestIndexedBlocks.value.reduce((acc, block) => acc + block.size, 0);
  const latestBlockDate = new Date(latestIndexedBlocks.value[0].timestamp);
  const firstBlockDate = new Date(latestIndexedBlocks.value[latestIndexedBlocks.value.length - 1].timestamp);
  const numberOfSeconds = Math.floor((latestBlockDate.getTime() - firstBlockDate.getTime()) / 1000);
  const tps = numberOfSeconds ? numberOfTransactions / numberOfSeconds : 0;
  return tps;
});
</script>
