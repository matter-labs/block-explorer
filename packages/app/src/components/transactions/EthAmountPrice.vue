<template>
  <TokenAmountPrice :token="token" :amount="amount" />
</template>
<script lang="ts" setup>
import { computed, type PropType } from 'vue';

import TokenAmountPrice from '@/components/TokenAmountPrice.vue';

import useContext from '@/composables/useContext';
import useToken, { type Token } from '@/composables/useToken';

import type { BigNumberish } from 'ethers';

const { currentNetwork } = useContext();

defineProps({
  amount: {
    type: String as PropType<BigNumberish>,
    default: '0',
    required: true,
  },
});

const { getTokenInfo, tokenInfo } = useToken();
getTokenInfo(currentNetwork.value.baseTokenAddress);

const token = computed<Token | null>(() => {
  return tokenInfo.value;
});
</script>
