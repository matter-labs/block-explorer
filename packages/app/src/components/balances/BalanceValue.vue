<template>
  <div v-if="balance && balance.token">
    <div class="balance-data-value">{{ formatValue(balance.balance, balance.token.decimals) }}</div>
    <div class="balance-data-price">
      <div>{{ tokenPriceAmount }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";

import type { Balance } from "@/composables/useAddress";

import { formatPricePretty, formatValue } from "@/utils/formatters";

const props = defineProps({
  balance: {
    type: Object as PropType<Balance>,
  },
});

const tokenPriceAmount = computed(() => {
  if (!props.balance?.token || !props.balance.token.usdPrice) return;

  return formatPricePretty(
    props.balance.balance,
    props.balance.token.decimals,
    props.balance.token.usdPrice.toString()
  );
});
</script>

<style scoped lang="scss"></style>
