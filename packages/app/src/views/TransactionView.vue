<template>
  <div class="transaction-error flex justify-center mt-24" v-if="isRequestFailed && !isRequestPending">
    <PageError />
  </div>
  <div class="transaction-info-page" v-else-if="props.hash && isTransactionHash(props.hash)">
    <div class="head-block flex flex-col-reverse justify-between mb-8 lg:flex-row lg:mb-10">
      <Breadcrumbs :items="breadcrumbItems" />
      <SearchForm class="search-form max-w-[34rem] mb-6 w-full lg:mb-0" />
    </div>
    <Title class="transaction-title mb-8" :title="t('transactions.transaction')" :value="hash" />
    <Tabs class="transactions-info-tabs shadow-md" v-if="transaction || isRequestPending" :tabs="tabs">
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
.head-block h1 {
  margin-top: 0.75rem;
}
</style>
