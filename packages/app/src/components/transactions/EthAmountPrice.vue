<template>
  <TokenAmountPrice :token="token" :amount="amount" />
</template>
<script lang="ts" setup>
import { computed, type PropType } from "vue";

import TokenAmountPrice from "@/components/TokenAmountPrice.vue";

import useToken from "@/composables/useToken";

import type { Token } from "@/composables/useToken";
import type { BigNumberish } from "ethers";

import { ETH_TOKEN } from "@/utils/constants";

defineProps({
  amount: {
    type: String as PropType<BigNumberish>,
    default: "0",
    required: true,
  },
});

const { getTokenInfo, tokenInfo } = useToken();
getTokenInfo(ETH_TOKEN.l2Address);

const token = computed<Token>(() => {
  return tokenInfo.value ?? { ...ETH_TOKEN, usdPrice: null };
});
</script>
