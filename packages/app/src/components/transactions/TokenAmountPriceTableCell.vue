<template>
  <TokenAmountPrice :token="tokenWithUsdPrice" :amount="amount" v-slot="{ token, decimalAmount, priceAmount }">
    <div class="token-amount-symbol">
      <Tooltip class="token-amount-short" :disabled="decimalAmount.length < 10">
        {{ shortenFitText(decimalAmount, "right", 100, 10) }}

        <template #content>{{ decimalAmount }} {{ token?.symbol }}</template>
      </Tooltip>
      <div class="token-amount" :data-testid="$testId.tokenAmount">{{ decimalAmount }}</div>
      <TokenIconLabel
        v-if="token"
        class="token-icon"
        :address="token.address"
        :symbol="token.symbol"
        show-link-symbol
      />
    </div>
    <span v-if="showPrice" class="token-price" :data-testid="$testId.tokenAmountPrice">
      <ContentLoader v-if="isTokenPricePending" class="inline-block h-full w-8" />
      <template v-else>{{ priceAmount }}</template>
    </span>
  </TokenAmountPrice>
</template>
<script lang="ts" setup>
import { computed, type PropType } from "vue";

import TokenAmountPrice from "@/components/TokenAmountPrice.vue";
import TokenIconLabel from "@/components/TokenIconLabel.vue";
import { shortenFitText } from "@/components/common/HashLabel.vue";
import Tooltip from "@/components/common/Tooltip.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";

import useTokenPrice from "@/composables/useTokenPrice";

import type { ApiToken, Token } from "@/composables/useToken";
import type { BigNumberish } from "ethers";

import { ETH_TOKEN } from "@/utils/constants";

const props = defineProps({
  amount: {
    type: String as PropType<BigNumberish>,
    default: "0",
    required: true,
  },
  showPrice: {
    type: Boolean,
    default: true,
  },
  token: {
    type: Object as PropType<ApiToken | null>,
    default: () => null,
    required: false,
  },
});

const { getTokenPrice, tokenPrice, isRequestPending: isTokenPricePending } = useTokenPrice();
getTokenPrice(props.token?.l2Address || ETH_TOKEN.l2Address);

const tokenWithUsdPrice = computed<Token>(() => {
  const tokenData = props.token ? { ...props.token, address: props.token.l2Address } : ETH_TOKEN;
  return { ...tokenData, usdPrice: tokenPrice.value };
});
</script>
<style lang="scss" scoped>
.token-amount-symbol {
  @apply flex items-center;
}
.token-amount-short {
  @apply hidden md:block;
}
.token-amount {
  @apply block md:hidden;
}
.token-amount-tooltip {
  @apply hidden md:block;
}
.token-price {
  @apply ml-0 text-xs text-gray-400;
}
.token-icon {
  @apply ml-1;
}
</style>
