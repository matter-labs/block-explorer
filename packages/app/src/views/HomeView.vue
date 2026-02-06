<template>
  <div class="home">
    <h1 class="title">{{ t("blockExplorer.title", { brandName }) }}</h1>
    <div class="subtitle">
      {{
        runtimeConfig.appEnvironment === "prividium"
          ? t("blockExplorer.prividiumSubtitle", { brandName })
          : t("blockExplorer.subtitle", { brandName })
      }}
    </div>
    <SearchForm class="search-form" />
    <div class="section">
      <NetworkStats
        v-if="networkStats || networkStatsPending"
        :loading="networkStatsPending"
        :committed="networkStats?.lastSealedBlock"
        :verified="networkStats?.lastVerifiedBlock"
        :transactions="networkStats?.totalTransactions"
        class="network-stats"
      />
    </div>
    <div class="latest-blocks-transactions">
      <div>
        <div class="blocks-label-container">
          <p>{{ t("blockExplorer.latestBlocks") }}</p>
          <InfoTooltip class="blocks-tooltip">{{ t("blocks.tooltipInfo") }}</InfoTooltip>
        </div>
        <template v-if="(isBlocksPending || blocks) && !isBlocksFailed">
          <TableBlocks :data-testid="$testId.latestBlocksTable" :loading="isBlocksPending" :blocks="displayedBlocks">
            <template #not-found>
              <p class="not-found">
                {{
                  runtimeConfig.appEnvironment === "prividium"
                    ? t("blocks.table.prividiumNotFoundHomePage")
                    : t("blocks.table.notFoundHomePage")
                }}
              </p>
            </template>
          </TableBlocks>
          <Button variant="outlined" color="primary" @click="router.push('blocks')">
            {{ t("blocks.viewAll") }}
            <ArrowRightIcon class="blocks-view-all-arrow" />
          </Button>
        </template>
        <span v-else-if="isBlocksFailed" class="error-message">
          {{ t("failedRequest") }}
        </span>
      </div>
      <div>
        <p>{{ t("blockExplorer.latestTransactions") }}</p>
        <TransactionsTable
          class="transactions-table"
          :columns="['status', 'transactionHash', 'age']"
          :pagination="false"
          :data-testid="$testId.latestTransactionsTable"
        >
          <template #not-found>
            <TableBodyColumn>
              <p class="not-found">
                {{
                  runtimeConfig.appEnvironment === "prividium"
                    ? t("transactions.table.prividiumNotFoundHomePage")
                    : t("transactions.table.notFoundHomePage")
                }}
              </p>
            </TableBodyColumn>
          </template>
        </TransactionsTable>
        <Button variant="outlined" color="primary" @click="router.push('transactions')">
          {{ t("transactions.viewAll") }}
          <ArrowRightIcon class="transactions-view-all-arrow" />
        </Button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { ArrowRightIcon } from "@heroicons/vue/outline";

import NetworkStats from "@/components/NetworkStats.vue";
import SearchForm from "@/components/SearchForm.vue";
import TableBlocks from "@/components/blocks/Table.vue";
import Button from "@/components/common/Button.vue";
import InfoTooltip from "@/components/common/InfoTooltip.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TransactionsTable from "@/components/transactions/Table.vue";

import useBlocks from "@/composables/useBlocks";
import useNetworkStats from "@/composables/useNetworkStats";
import useRuntimeConfig from "@/composables/useRuntimeConfig";

import router from "@/router";

const { t } = useI18n();
const runtimeConfig = useRuntimeConfig();
const { brandName } = runtimeConfig;
const { fetch: fetchNetworkStats, pending: networkStatsPending, item: networkStats } = useNetworkStats();
const { load: getBlocks, pending: isBlocksPending, failed: isBlocksFailed, data: blocks } = useBlocks();

const displayedBlocks = computed(() => {
  return blocks.value ? blocks.value : [];
});

fetchNetworkStats();

getBlocks(1, new Date());
</script>

<style lang="scss" scoped>
.home {
  @apply mt-4;

  .title {
    @apply text-4xl font-bold text-white;
  }
  .subtitle {
    @apply mt-2 text-base text-white sm:text-2xl;
  }

  .section {
    @apply block justify-between gap-x-4 pt-9 lg:pt-14;
    .network-stats {
      @apply mb-5 lg:mb-0;
    }
  }

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
    p {
      @apply mb-3 text-2xl font-bold text-neutral-700;
    }
    .error-message {
      @apply h-full;
    }
    .blocks-label-container {
      @apply flex items-center gap-x-1;
      .blocks-tooltip {
        @apply mb-3;
      }
    }
    .blocks-view-all-arrow,
    .transactions-view-all-arrow {
      @apply ml-1 w-4;
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
