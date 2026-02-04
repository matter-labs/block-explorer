<template>
  <div class="head-block">
    <Breadcrumbs :items="breadcrumbItems" />
    <SearchForm class="search-form" />
  </div>
  <div class="flex items-center justify-start gap-2">
    <div class="token-icon-container">
      <img
        v-if="contract?.address && !pending && tokenInfo"
        class="token-img"
        :src="tokenInfo.iconURL || '/images/currencies/customToken.svg'"
        :alt="tokenInfo.symbol || t('balances.table.unknownSymbol')"
      />
    </div>

    <Title
      v-if="contract?.address && !pending"
      :title="
        tokenInfo?.name && tokenInfo?.symbol
          ? `${tokenInfo?.name} (${tokenInfo?.symbol})`
          : contractName ?? t('contract.title')
      "
      :value="contractName ? undefined : contract?.address"
      :is-verified="contract?.verificationInfo != null"
      :is-evm-like="contract?.isEvmLike"
    />
    <Spinner v-else size="md" />
  </div>
  <div class="tables-container">
    <div class="contract-tables-container">
      <div>
        <OverviewTokenInfoTable
          class="token-info-table"
          :loading="isLoadingTokenOverview"
          :tokenOverview="tokenOverview"
          :tokenInfo="tokenInfo"
        />
      </div>
      <div>
        <MarketTokenInfoTable class="token-info-table" :loading="pending" :tokenInfo="tokenInfo!" />
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
        <ContractInfoTab :contract="contract" />
      </template>
      <template #tab-3-content>
        <ContractEvents v-if="showEventsTab" :contract="contract" />
      </template>
    </Tabs>
  </div>
</template>
<script lang="ts" setup>
import { computed, type PropType, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { CheckCircleIcon } from "@heroicons/vue/solid";

import SearchForm from "@/components/SearchForm.vue";
import Breadcrumbs from "@/components/common/Breadcrumbs.vue";
import Spinner from "@/components/common/Spinner.vue";
import Tabs from "@/components/common/Tabs.vue";
import Title from "@/components/common/Title.vue";
import ContractInfoTab from "@/components/contract/ContractInfoTab.vue";
import TransactionEmptyState from "@/components/contract/TransactionEmptyState.vue";
import ContractEvents from "@/components/event/ContractEvents.vue";
import MarketTokenInfoTable from "@/components/token/MarketTokenInfoTable.vue";
import OverviewTokenInfoTable from "@/components/token/OverviewTokenInfoTable.vue";
import TransactionsTable from "@/components/transactions/Table.vue";

import useContext from "@/composables/useContext";
import useRuntimeConfig from "@/composables/useRuntimeConfig";
import useToken from "@/composables/useToken";
import useTokenOverview from "@/composables/useTokenOverview";

import type { BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";
import type { Contract } from "@/composables/useAddress";

import { shortValue } from "@/utils/formatters";

const { t } = useI18n();
const runtimeConfig = useRuntimeConfig();
const context = useContext();

const isPrividium = runtimeConfig.appEnvironment === "prividium";
const isAdmin = computed(() => context.user.value.loggedIn && context.user.value.roles.includes("admin"));
const showEventsTab = computed(() => !isPrividium || isAdmin.value);

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

const { getTokenInfo, tokenInfo } = useToken();
const { getTokenOverview, tokenOverview, isRequestPending: isLoadingTokenOverview } = useTokenOverview();

watchEffect(() => {
  if (props.contract) {
    getTokenInfo(props.contract.address);
    getTokenOverview(props.contract.address);
  }
});

const tabs = computed(() => [
  { title: t("tabs.transactions"), hash: "#transactions" },
  {
    title: t("tabs.contract"),
    hash: "#contract",
    icon: props.contract?.verificationInfo ? CheckCircleIcon : null,
  },
  { title: t("tabs.events"), hash: showEventsTab.value ? "#events" : null },
]);

const breadcrumbItems = computed((): BreadcrumbItem[] | [] => {
  if (props.contract?.address) {
    return [
      { to: { name: "home" }, text: t("breadcrumbs.home") },
      {
        text: `${t("tokenView.token")} ${shortValue(props.contract?.address)}`,
      },
    ];
  }
  return [];
});

const contractName = computed(() =>
  props.contract?.verificationInfo?.compilation.fullyQualifiedName.replace(/.*\.sol:/, "")
);
const contractABI = computed(() => props.contract?.verificationInfo?.abi);

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
}
.transaction-table-error {
  @apply text-2xl text-error-700;
}

.token-icon-container {
  @apply relative h-8 w-8 overflow-hidden rounded-full;

  .token-img-loader,
  .token-img {
    @apply absolute inset-0 h-full w-full rounded-full;
  }
  .token-img-loader {
    @apply animate-pulse bg-neutral-200;
  }
  .token-img {
    @apply transition-opacity duration-150;
  }
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
