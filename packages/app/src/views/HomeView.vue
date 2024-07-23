<template>
  <div class="home mt-4">
    <h1 class="title text text-center text-5xl font-semibold">
      Explorer.
      <span class="text-gray">Every transaction. Every contract. Every block.</span>
    </h1>
    <div class="flex justify-center px-6">
      <SearchForm class="search-form w-[576px] max-w-full max-lg:mb-8" />
    </div>
    <div class="section mt-8 block justify-between gap-x-4 border-t-2 border-t-black/5 pt-8 lg:mt-12 lg:pt-12">
      <NetworkStats
        v-if="networkStats || networkStatsPending"
        :loading="networkStatsPending"
        :committed="networkStats?.lastSealedBlock"
        :verified="networkStats?.lastVerifiedBlock"
        :transactions="networkStats?.totalTransactions"
        class="network-stats mb-5 lg:mb-0"
      />
    </div>
    <div class="latest-blocks-transactions">
      <div>
        <div class="batches-label-container flex items-center gap-x-1">
          <p class="mb-3 text-2xl font-semibold">{{ t("blockExplorer.batches") }}</p>
          <!-- <InfoTooltip class="batches-tooltip mb-3">{{ t("batches.tooltipInfo") }}</InfoTooltip> -->
        </div>
        <TableBatches
          v-if="(isBatchesPending || batches) && !isBatchesFailed"
          :data-testid="$testId.latestBatchesTable"
          :loading="isBatchesPending"
          :batches="displayedBatches"
          :columns="['status', 'size', 'txnBatch', 'age']"
        >
          <template #not-found>
            <p class="not-found">{{ t("batches.table.notFoundHomePage") }}</p>
          </template>
        </TableBatches>
        <span v-else-if="isBatchesFailed" class="error-message">
          {{ t("failedRequest") }}
        </span>
      </div>
      <div>
        <p class="mb-3 text-2xl font-semibold">{{ t("blockExplorer.latestTransactions") }}</p>
        <TransactionsTable
          class="transactions-table"
          :columns="['status', 'transactionHash', 'age']"
          :pagination="false"
          :data-testid="$testId.latestTransactionsTable"
        >
          <template #not-found>
            <TableBodyColumn>
              <p class="not-found">{{ t("transactions.table.notFoundHomePage") }}</p>
            </TableBodyColumn>
          </template>
        </TransactionsTable>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import NetworkStats from "@/components/NetworkStats.vue";
import SearchForm from "@/components/SearchForm.vue";
import TableBatches from "@/components/batches/Table.vue";
import InfoTooltip from "@/components/common/InfoTooltip.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TransactionsTable from "@/components/transactions/Table.vue";

import useBatches from "@/composables/useBatches";
import useNetworkStats from "@/composables/useNetworkStats";

const { t } = useI18n();
const { fetch: fetchNetworkStats, pending: networkStatsPending, item: networkStats } = useNetworkStats();
const { load: getBatches, pending: isBatchesPending, failed: isBatchesFailed, data: batches } = useBatches();

const displayedBatches = computed(() => {
  return batches.value ? batches.value : [];
});

fetchNetworkStats();

getBatches(1, new Date());
</script>

<style lang="scss" scoped>
.title {
  text-wrap: balance;
}

.home {
  .search-form {
    @apply mt-6 max-w-xl sm:mt-14 lg:mt-9;
  }

  .latest-blocks-transactions {
    @apply mb-0.5 mt-9 block gap-x-5 lg:flex;

    > div:first-child {
      @apply mb-9 lg:mb-0;
    }

    > div {
      @apply flex w-full flex-col;
    }

    .error-message {
      @apply h-full;
    }
  }

  .error-message {
    @apply mb-5 flex w-full items-center justify-center rounded-lg border border-rose-600 p-5 text-center text-lg text-rose-600 lg:mb-0;
  }

  .pending {
    @apply mb-5 flex min-h-[calc(100vh-484px)] w-full items-center justify-center lg:mb-0 lg:min-h-0;
  }

  .not-found {
    @apply whitespace-normal py-8 text-center text-neutral-400;
  }
}
</style>
