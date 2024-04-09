<template>
  <div class="head-block">
    <Breadcrumbs :items="breadcrumbItems" />
    <SearchForm class="search-form" />
  </div>
  <Title
    v-if="contract?.address && !pending"
    :title="contractName ?? t('contract.title')"
    :value="contractName ? undefined : contract?.address"
  />
  <Spinner v-else size="md" />
  <div class="tables-container">
    <div class="contract-tables-container">
      <div>
        <ContractInfoTable class="contract-info-table" :loading="pending" :contract="contract!" />
      </div>
      <div>
        <BalanceTable class="balance-table" :loading="pending" :balances="contract?.balances">
          <template #not-found>
            <EmptyState>
              <template #image>
                <div class="balances-empty-icon">
                  <img src="/images/empty-state/empty_balance.svg" alt="empty_balance" />
                </div>
              </template>
              <template #title>
                {{ t("contract.balances.notFound.title") }}
              </template>
              <template #description>
                <div class="balances-empty-description">{{ t("contract.balances.notFound.subtitle") }}</div>
              </template>
            </EmptyState>
          </template>
          <template #failed>
            <EmptyState>
              <template #image>
                <div class="balances-empty-icon">
                  <img src="/images/empty-state/error_balance.svg" alt="empty_balance" />
                </div>
              </template>
              <template #title>
                {{ t("contract.balances.error.title") }}
              </template>
              <template #description>
                <div class="balances-empty-description">{{ t("contract.balances.error.subtitle") }}</div>
              </template>
            </EmptyState>
          </template>
        </BalanceTable>
      </div>
    </div>

    <Tabs v-if="contract?.address && !pending" class="contract-tabs" :tabs="tabs">
      <template #tab-1-content>
        <TransactionsTable
          class="transactions-table"
          :search-params="transactionsSearchParams"
          :contract-abi="contractABI"
        >
          <template #not-found>
            <TransactionEmptyState />
          </template>
        </TransactionsTable>
      </template>
      <template #tab-2-content>
        <TransfersTable :address="contract.address" />
      </template>
      <template #tab-3-content>
        <ContractInfoTab :contract="contract" />
      </template>
      <template #tab-4-content>
        <ContractEvents :contract="contract" />
      </template>
    </Tabs>
  </div>
</template>
<script lang="ts" setup>
import { computed, type PropType } from "vue";
import { useI18n } from "vue-i18n";

import SearchForm from "@/components/SearchForm.vue";
import BalanceTable from "@/components/balances/Table.vue";
import Breadcrumbs from "@/components/common/Breadcrumbs.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import Spinner from "@/components/common/Spinner.vue";
import Tabs from "@/components/common/Tabs.vue";
import Title from "@/components/common/Title.vue";
import ContractInfoTab from "@/components/contract/ContractInfoTab.vue";
import ContractInfoTable from "@/components/contract/InfoTable.vue";
import TransactionEmptyState from "@/components/contract/TransactionEmptyState.vue";
import ContractEvents from "@/components/event/ContractEvents.vue";
import TransactionsTable from "@/components/transactions/Table.vue";
import TransfersTable from "@/components/transfers/Table.vue";

import type { BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";
import type { Contract } from "@/composables/useAddress";

import { shortValue } from "@/utils/formatters";

const { t } = useI18n();

const props = defineProps({
  contract: {
    type: [Object, null] as PropType<Contract | null>,
    required: true,
    default: null,
  },
  pending: {
    type: Boolean,
    default: false,
  },
  failed: {
    type: Boolean,
    default: false,
  },
});

const tabs = computed(() => [
  { title: t("tabs.transactions"), hash: "#transactions" },
  { title: t("tabs.transfers"), hash: "#transfers" },
  { title: t("tabs.contract"), hash: "#contract" },
  { title: t("tabs.events"), hash: "#events" },
]);
const breadcrumbItems = computed((): BreadcrumbItem[] | [] => {
  if (props.contract?.address) {
    return [
      { to: { name: "home" }, text: t("breadcrumbs.home") },
      {
        text: `${t("contract.contractNumber")}${shortValue(props.contract?.address)}`,
      },
    ];
  }
  return [];
});

const contractName = computed(() => props.contract?.verificationInfo?.request.contractName.replace(/.*\.sol:/, ""));
const contractABI = computed(() => props.contract?.verificationInfo?.artifacts.abi);

const transactionsSearchParams = computed(() => ({
  address: props.contract?.address,
}));
</script>
<style lang="scss" scoped>
.head-block {
  @apply mb-8 flex flex-col-reverse justify-between lg:mb-10 lg:flex-row;
  h1 {
    @apply mt-3;
  }
  .search-form {
    @apply mb-6 w-full max-w-[26rem] lg:mb-0;
  }
}
.tables-container {
  @apply mt-8 grid grid-cols-1 gap-4;
  .contract-tabs {
    @apply shadow-md;
  }
  .contract-tables-container {
    @apply grid grid-cols-1 gap-4 lg:grid-cols-2;
  }
  h2 {
    @apply mb-4;
  }
  .contract-info-table {
    @apply mb-8 overflow-hidden;
  }
  .transactions-table {
    @apply shadow-none;
    .table-body {
      @apply rounded-none;
    }
  }
  .balance-table {
    @apply mb-4 overflow-hidden bg-white;
    .balances-empty-icon {
      @apply m-auto;
      img {
        @apply w-[2.875rem];
      }
    }
    .balances-empty-description {
      @apply max-w-[16rem] whitespace-normal;
    }
  }
}
.transaction-table-error {
  @apply text-2xl text-error-700;
}
</style>

<style lang="scss">
.contract-tabs {
  .tab-head {
    @apply overflow-auto;
  }
  .transactions-table {
    .table-body {
      @apply rounded-t-none;
    }
    table thead tr th {
      @apply first:rounded-none last:rounded-none;
    }
  }
}
</style>
