<template>
  <TokenAmountPrice :token="token" :amount="amount" />
</template>
<script lang="ts" setup>
import { computed, type PropType } from "vue";

import TokenAmountPrice from "@/components/TokenAmountPrice.vue";

import useToken, { type Token } from "@/composables/useToken";

import type { BigNumberish } from "ethers";

import { ETH_TOKEN_L2_ADDRESS } from "@/utils/constants";

defineProps({
  amount: {
    type: String as PropType<BigNumberish>,
    default: "0",
    required: true,
  },
});

const { getTokenInfo, tokenInfo } = useToken();
getTokenInfo(ETH_TOKEN_L2_ADDRESS);

const token = computed<Token | null>(() => {
  return tokenInfo.value;
});
</script>
