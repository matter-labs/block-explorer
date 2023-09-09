<template>
  <div class="transaction-error" v-if="isRequestFailed && !isRequestPending">
    <PageError />
  </div>
  <div v-else-if="props.hash && isTransactionHash(props.hash)" class="transaction-info-page">
    <div class="head-block">
      <Breadcrumbs :items="breadcrumbItems" />
      <SearchForm class="search-form" />
    </div>
    <Title :title="t('transactions.transaction')" :value="hash" class="transaction-title" />
    <Tabs class="transactions-info-tabs" v-if="transaction || isRequestPending" :tabs="tabs">
      <template #tab-1-content>
        <GeneralInfo
          :transaction="transactionWithData"
          :decoding-data-error="decodingError"
          :loading="isRequestPending || isDecodeTransactionDataPending"
        />
      </template>
      <template #tab-2-content>
        <Logs
          :logs="transactionEventLogs"
          :initiator-address="transaction?.from"
          :loading="isRequestPending || isDecodeEventLogsPending"
        />
      </template>
    </Tabs>
  </div>
</template>

<script lang="ts" setup>
import { computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import PageError from "@/components/PageError.vue";
import SearchForm from "@/components/SearchForm.vue";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";
import Tabs from "@/components/common/Tabs.vue";
import Title from "@/components/common/Title.vue";
import GeneralInfo from "@/components/transactions/infoTable/GeneralInfo.vue";
import Logs from "@/components/transactions/infoTable/Logs.vue";

import useEventLog from "@/composables/useEventLog";
import useNotFound from "@/composables/useNotFound";
import useTransaction, { type TransactionItem } from "@/composables/useTransaction";
import useTransactionData from "@/composables/useTransactionData";

import { shortValue } from "@/utils/formatters";
import { isTransactionHash } from "@/utils/validators";

const props = defineProps({
  hash: {
    type: String,
    required: true,
  },
});

const { t } = useI18n();
const { useNotFoundView, setNotFoundView } = useNotFound();
const { transaction, isRequestPending, isRequestFailed, getByHash } = useTransaction();
const { collection: transactionEventLogs, isDecodePending: isDecodeEventLogsPending, decodeEventLog } = useEventLog();
const {
  data: transactionData,
  isDecodePending: isDecodeTransactionDataPending,
  decodingError,
  decodeTransactionData,
} = useTransactionData();

const transactionWithData = computed<TransactionItem | null>(() => {
  if (transaction.value && transactionData.value) {
    return {
      ...transaction.value,
      data: transactionData.value,
    };
  }
  return transaction.value;
});

const blockNumber = computed(() => transaction.value?.blockNumber);
const breadcrumbItems = computed((): BreadcrumbItem[] => [
  { to: { name: "home" }, text: t("breadcrumbs.home") },
  blockNumber.value
    ? {
        to: { name: "block", params: { id: blockNumber.value } },
        text: `${t("blocks.blockNumber")}${blockNumber.value}`,
      }
    : { text: t("blocks.blocks") },
  {
    text: `${t("transactions.transaction")} ${
      transaction.value?.hash ? shortValue(transaction.value.hash) : shortValue(props.hash)
    }`,
  },
]);

const tabs = computed(() => [
  {
    title: t("transactions.tabs.generalInfo"),
    hash: "#overview",
  },
  {
    title: t("transactions.tabs.logs") + (transaction.value ? ` (${transaction.value?.logs.length})` : ""),
    hash: "#eventlog",
  },
]);

useNotFoundView(isRequestPending, isRequestFailed, transaction);

watchEffect(() => {
  if (!props.hash || !isTransactionHash(props.hash)) {
    return setNotFoundView();
  }
  getByHash(props.hash).then(() => {
    if (!transaction.value) {
      transactionEventLogs.value = [];
      return;
    }
    decodeEventLog(transaction.value.logs);
    decodeTransactionData(transaction.value.data);
  });
});
</script>

<style lang="scss" scoped>
.head-block {
  @apply mb-8 flex flex-col-reverse justify-between lg:mb-10 lg:flex-row;
  .search-form {
    @apply mb-6 w-full max-w-[26rem] lg:mb-0;
  }
  h1 {
    @apply mt-3;
  }
}
.transactions-info-tabs {
  @apply shadow-md;
}
.transaction-error {
  @apply mt-24 flex justify-center;
}
.transaction-title {
  @apply mb-8;
}
</style>
