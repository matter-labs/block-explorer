<template>
  <div class="block-error" v-if="blockFailed && !blockPending">
    <PageError />
  </div>
  <div v-else-if="props.id && isBlockNumber(props.id)">
    <div class="head-block">
      <Breadcrumbs :items="breadcrumbItems" />
      <SearchForm class="search-form" />
    </div>
    <Title v-if="!blockPending" :title="t('blocks.blockNumber')" :value="id">
      {{ parseInt(id) }}
    </Title>
    <Spinner v-else size="md" />
    <div class="tables-container">
      <div>
        <BlockTable class="block-table" :loading="blockPending" :block="blockItem" :block-number="id" />
      </div>
      <div>
        <h2 class="table-transaction-title">{{ t("blocks.transactionTable.title") }}</h2>
        <TransactionsTable
          class="transactions-table"
          :search-params="transactionsSearchParams"
          data-testid="block-transactions-table"
        >
          <template #not-found>
            <TransactionEmptyState :block-exists="!!blockItem" />
          </template>
        </TransactionsTable>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import PageError from "@/components/PageError.vue";
import SearchForm from "@/components/SearchForm.vue";
import BlockTable from "@/components/blocks/InfoTable.vue";
import TransactionEmptyState from "@/components/blocks/TransactionEmptyState.vue";
import Breadcrumbs from "@/components/common/Breadcrumbs.vue";
import Spinner from "@/components/common/Spinner.vue";
import Title from "@/components/common/Title.vue";
import TransactionsTable from "@/components/transactions/Table.vue";

import useBlock from "@/composables/useBlock";
import useNotFound from "@/composables/useNotFound";

import type { BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";

import { isBlockNumber } from "@/utils/validators";

const { t } = useI18n();

const { setNotFoundView } = useNotFound();
const { getById, blockItem, isRequestPending: blockPending, isRequestFailed: blockFailed } = useBlock();

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    text: t("breadcrumbs.home"),
    to: { name: "home" },
  },
  {
    text: t("blocksView.title"),
    to: { name: "blocks" },
  },
  {
    text: `${t("blocks.blockNumber")}${parseInt(props.id)}`,
  },
]);

const transactionsSearchParams = computed(() => ({
  blockNumber: parseInt(props.id),
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
  .block-table {
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
.block-error {
  @apply mt-24 flex justify-center;
}
</style>
