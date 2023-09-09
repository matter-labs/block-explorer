<template>
  <div v-if="balance && balance.token">
    <div class="balance-data-value">{{ formatValue(balance.balance, balance.token.decimals) }}</div>
    <div class="balance-data-price">
      <ContentLoader v-if="isRequestPending" class="h-full w-8" />
      <div v-else>{{ tokenPriceAmount }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, watchEffect } from "vue";

import ContentLoader from "@/components/common/loaders/ContentLoader.vue";

import useTokenPrice from "@/composables/useTokenPrice";

import type { Balance } from "@/composables/useAddress";

import { formatPricePretty, formatValue } from "@/utils/formatters";

const props = defineProps({
  balance: {
    type: Object as PropType<Balance>,
  },
});

const { getTokenPrice, tokenPrice, isRequestPending } = useTokenPrice();

watchEffect(() => {
  getTokenPrice(props.balance?.token?.l2Address);
});

const tokenPriceAmount = computed(() => {
  if (!props.balance?.token || !tokenPrice.value) return;

  return formatPricePretty(props.balance.balance, props.balance.token.decimals, tokenPrice.value);
});
</script>

<style scoped lang="scss"></style>
