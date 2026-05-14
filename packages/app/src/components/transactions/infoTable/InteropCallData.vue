<template>
  <TransactionData v-if="data" :data="data" :error="decodingError" />
  <div v-else class="interop-call-data-loading">
    <Spinner size="sm" outline />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, type PropType } from "vue";

import Spinner from "@/components/common/Spinner.vue";
import TransactionData from "@/components/transactions/infoTable/TransactionData.vue";

import useTransactionData from "@/composables/useTransactionData";

import type { Address } from "@/types";

const props = defineProps({
  to: {
    type: String as PropType<Address>,
    required: true,
  },
  callData: {
    type: String,
    required: true,
  },
  callValue: {
    type: String,
    required: true,
  },
});

const { data, decodingError, decodeTransactionData } = useTransactionData();

onMounted(() => {
  decodeTransactionData({
    calldata: props.callData,
    contractAddress: props.to,
    value: props.callValue,
    sighash: props.callData.slice(0, 10),
  });
});
</script>
