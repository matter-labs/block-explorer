<template>
  <div class="token-price-container">
    <div v-if="tokenInfo?.usdPrice && !isRequestPending" class="token-price">
      {{ priceAmount }}
    </div>
    <div v-else-if="isRequestPending">
      <Spinner />
    </div>
    <div v-else></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watchEffect } from "vue";

import Spinner from "@/components/common/Spinner.vue";

import useToken from "@/composables/useToken";

import type { Hash } from "@/types";
import type { PropType } from "vue";

import { formatPricePretty } from "@/utils/formatters";

const props = defineProps({
  address: {
    type: String as PropType<Hash>,
    default: "",
  },
});

const { getTokenInfo, tokenInfo, isRequestPending } = useToken();

watchEffect(() => {
  if (props.address) {
    getTokenInfo(props.address);
  }
});

const priceAmount = computed(() => {
  if (tokenInfo.value && tokenInfo.value.usdPrice) {
    return formatPricePretty(
      "1".padEnd(tokenInfo.value.decimals + 1, "0"),
      tokenInfo.value.decimals,
      tokenInfo.value.usdPrice.toString()
    );
  }
  return "";
});
</script>

<style scoped lang="scss">
.token-price-container {
  @apply h-[20px];
}
</style>
