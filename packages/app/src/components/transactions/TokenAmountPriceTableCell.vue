<template>
  <TokenAmountPrice :token="token" :amount="amount" v-slot="{ token: tokenInfo, decimalAmount, priceAmount }">
    <template v-if="tokenInfo && decimalAmount">
      <div class="token-amount-symbol">
        <Tooltip class="token-amount-short" :disabled="decimalAmount.length < 10">
          {{ shortenFitText(decimalAmount, "right", 100, 10) }}

          <template #content>{{ decimalAmount }} {{ tokenInfo.symbol }}</template>
        </Tooltip>
        <div class="token-amount" :data-testid="$testId.tokenAmount">{{ decimalAmount }}</div>
        <TokenIconLabel
          class="token-icon"
          :address="tokenInfo.l2Address"
          :symbol="tokenInfo.symbol"
          :icon-url="tokenInfo.iconURL"
          show-link-symbol
        />
      </div>
      <span v-if="showPrice" class="token-price" :data-testid="$testId.tokenAmountPrice">
        {{ priceAmount }}
      </span>
    </template>
    <template v-else>—</template>
  </TokenAmountPrice>
</template>
<script lang="ts" setup>
import TokenAmountPrice from "@/components/TokenAmountPrice.vue";
import TokenIconLabel from "@/components/TokenIconLabel.vue";
import { shortenFitText } from "@/components/common/HashLabel.vue";
import Tooltip from "@/components/common/Tooltip.vue";

import type { Token } from "@/composables/useToken";
import type { BigNumberish } from "ethers";
import type { PropType } from "vue";

defineProps({
  amount: {
    type: String as PropType<BigNumberish | null>,
    default: "0",
    required: true,
  },
  showPrice: {
    type: Boolean,
    default: true,
  },
  token: {
    type: Object as PropType<Token | null>,
    default: () => null,
    required: false,
  },
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
