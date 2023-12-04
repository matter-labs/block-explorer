<template>
  <div class="batch-error" v-if="batchFailed && !batchPending">
    <PageError />
  </div>
  <div v-else-if="props.id && isBlockNumber(props.id)">
    <div class="head-block">
      <Breadcrumbs :items="breadcrumbItems" />
      <SearchForm class="search-form" />
    </div>
    <Title v-if="!batchPending" :title="t('batches.batchNumber')" :value="id">
      {{ parseInt(id) }}
    </Title>
    <Spinner v-else size="md" />

    <div class="tables-container">
      <BatchTable class="batch-table" :loading="batchPending" :batch="batchItem" :batch-number="id" />

      <div ref="transactionsContainer">
        <h2 class="table-transaction-title">{{ t("batches.transactionTable.title") }}</h2>
        <TransactionsTable class="transactions-table" :search-params="transactionsSearchParams">
          <template #not-found>
            <TransactionEmptyState :batch-exists="!!batchItem" />
          </template>
        </TransactionsTable>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import PageError from "@/components/PageError.vue";
import SearchForm from "@/components/SearchForm.vue";
import BatchTable from "@/components/batches/InfoTable.vue";
import TransactionEmptyState from "@/components/batches/TransactionEmptyState.vue";
import Breadcrumbs from "@/components/common/Breadcrumbs.vue";
import Spinner from "@/components/common/Spinner.vue";
import Title from "@/components/common/Title.vue";
import TransactionsTable from "@/components/transactions/Table.vue";

import useBatch from "@/composables/useBatch";
import useNotFound from "@/composables/useNotFound";

import type { BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";

import { isBlockNumber } from "@/utils/validators";

const { t } = useI18n();

const { setNotFoundView } = useNotFound();
const { getById, batchItem, isRequestPending: batchPending, isRequestFailed: batchFailed } = useBatch();

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  scrollToTxns: {
    type: Boolean,
    default: false,
  },
});

const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    text: t("breadcrumbs.home"),
    to: { name: "home" },
  },
  {
    text: t("batches.title"),
    to: { name: "batches" },
  },
  {
    text: `${t("batches.batchNumber")}${parseInt(props.id).toString()}`,
  },
]);

const transactionsContainer = ref(null as HTMLElement | null);

watch(transactionsContainer, () => {
  if (props.scrollToTxns && transactionsContainer.value) {
    window.scrollTo(0, transactionsContainer.value.offsetTop + 250);
  }
});

const transactionsSearchParams = computed(() => ({
  l1BatchNumber: parseInt(props.id),
}));

watchEffect(() => {
  if (!props.id || !isBlockNumber(props.id)) {
    return setNotFoundView();
  }
  getById(parseInt(props.id).toString());
});
</script>
<style lang="scss" scoped>
.head-block {
  @apply mb-8 flex flex-col-reverse justify-between lg:mb-10 lg:flex-row;
  h1 {
    @apply mt-3 text-gray-200;
  }
  .search-form {
    @apply mb-6 w-full max-w-[26rem] lg:mb-0;
  }
}
.tables-container {
  @apply mt-8 grid grid-cols-1 gap-4;

  h2 {
    @apply mb-4 text-gray-200;
  }
  .table-transaction-title {
    @apply text-gray-700;
  }
  .batch-table {
    @apply mb-8;
  }
  .transactions-table {
    @apply shadow-md;
    button {
      @apply w-full cursor-pointer py-2 text-center text-xs text-gray-500 underline hover:text-gray-400;
    }
  }
}
.transaction-table-error {
  @apply text-2xl text-error-700;
}
.batch-error {
  @apply mt-24 flex justify-center;
}
</style>
