<template>
  <slot :token="token" :decimal-amount="decimalAmount" :price-amount="priceAmount">
    <div class="token-amount-price">
      <template v-if="token && decimalAmount">
        <div class="token-amount">{{ decimalAmount }}</div>
        <TokenIconLabel
          class="token-icon"
          :address="token.l2Address"
          :symbol="token.symbol"
          :icon-url="token.iconURL"
          show-link-symbol
        />
        <span class="token-price" v-if="priceAmount">{{ priceAmount }}</span>
      </template>
      <template v-else>—</template>
    </div>
  </slot>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import TokenIconLabel from "@/components/TokenIconLabel.vue";

import type { Token } from "@/composables/useToken";
import type { BigNumberish } from "ethers";
import type { PropType } from "vue";

import { formatBigNumberish, formatPricePretty } from "@/utils/formatters";

const props = defineProps({
  amount: {
    type: String as PropType<BigNumberish | null>,
    default: "0",
    required: true,
  },
  token: {
    type: Object as PropType<Token | null>,
    default: null,
    required: false,
  },
});

const priceAmount = computed(() => {
  if (props.amount && props.token && props.token.usdPrice) {
    return formatPricePretty(props.amount, props.token.decimals, props.token.usdPrice.toString());
  }
  return "";
});

const decimalAmount = computed(() =>
  props.amount && props.token ? formatBigNumberish(props.amount, props.token.decimals) : ""
);
</script>

<style lang="scss" scoped>
.token-amount-price {
  @apply flex items-center;
  .token-amount-symbol {
    .content-loader {
      @apply w-20;
    }
  }
  .token-price {
    @apply ml-2 text-gray-400;

    .content-loader {
      @apply h-4 w-12;
    }
  }
  .token-icon {
    @apply ml-1.5;
  }
}
</style>
