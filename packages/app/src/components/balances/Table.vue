<template>
  <Table class="balances-table" :loading="loading || isTokenLibraryRequestPending" :items="displayedBalances">
    <template v-if="validBalances.length" #table-head>
      <table-head-column>{{ t("balances.table.asset") }}</table-head-column>
      <table-head-column>{{ t("balances.table.balance") }}</table-head-column>
      <table-head-column>{{ t("balances.table.address") }}</table-head-column>
    </template>
    <template #table-row="{ item }: { item: any }">
      <TableBodyColumn>
        <TokenIconLabel
          class="token-icon"
          :address="item.token.l2Address"
          :symbol="item.token.symbol"
          :icon-url="item.token.iconURL"
          show-link-symbol
        />
      </TableBodyColumn>
      <TableBodyColumn>
        <BalanceValue :balance="item" />
      </TableBodyColumn>
      <TableBodyColumn>
        <CopyContent :value="item.token.l2Address"></CopyContent>
      </TableBodyColumn>
    </template>
    <template #empty>
      <TableBodyColumn colspan="5">
        <div class="balances-not-found">
          <slot name="not-found">{{ t("balances.table.notFound") }}</slot>
        </div>
      </TableBodyColumn>
    </template>
    <template #loading>
      <tr class="loading-row" v-for="row in 3" :key="row">
        <TableBodyColumn v-for="col in 3" :key="col">
          <ContentLoader />
        </TableBodyColumn>
      </tr>
    </template>
    <template #footer v-if="validBalances.length > HIDDEN_BALANCES_AMOUNT && !displayAllBalances">
      <div class="load-all">
        <button @click="showAllBalances">{{ t("balances.table.showAll") }} ({{ validBalances.length }})</button>
      </div>
    </template>
  </Table>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import TokenIconLabel from "@/components/TokenIconLabel.vue";
import BalanceValue from "@/components/balances/BalanceValue.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TableHeadColumn from "@/components/common/table/TableHeadColumn.vue";
import CopyContent from "@/components/common/table/fields/CopyContent.vue";

import useContext from "@/composables/useContext";
import useTokenLibrary from "@/composables/useTokenLibrary";

import type { Balances } from "@/composables/useAddress";

const { currentNetwork } = useContext();
const { t } = useI18n();

const props = defineProps({
  balances: {
    type: Object as PropType<Balances>,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: true,
  },
});

const {
  getToken: getLibraryToken,
  getTokens: getLibraryTokens,
  isRequestPending: isTokenLibraryRequestPending,
} = useTokenLibrary();
getLibraryTokens();

const HIDDEN_BALANCES_AMOUNT = 5;
const displayAllBalances = ref(false);
function showAllBalances() {
  displayAllBalances.value = true;
}

const validBalances = computed(() =>
  Object.values(props.balances).filter((e) => BigInt(e.balance) != BigInt(0) && e.token)
);
const displayedBalances = computed(() => {
  return [...validBalances.value]
    .sort((a, b) => {
      if (!a.token || !b.token) return 0;

      if (a.token.l2Address === currentNetwork.value.baseTokenAddress) {
        return -1;
      } else if (b.token.l2Address === currentNetwork.value.baseTokenAddress) {
        return 1;
      }

      if (a.token.liquidity || b.token.liquidity) {
        return (a.token.liquidity || 0) > (b.token.liquidity || 0) ? -1 : 1;
      }

      const isATokenInLibrary = Boolean(getLibraryToken(a.token.l2Address));
      const isBTokenInLibrary = Boolean(getLibraryToken(b.token.l2Address));
      if (isATokenInLibrary && !isBTokenInLibrary) {
        return -1;
      } else if (!isATokenInLibrary && isBTokenInLibrary) {
        return 1;
      }

      if (a.token.symbol === null) {
        return 1;
      } else if (b.token.symbol === null) {
        return -1;
      }

      return a.token.symbol.localeCompare(b.token.symbol);
    })
    .splice(0, displayAllBalances.value ? validBalances.value.length : HIDDEN_BALANCES_AMOUNT);
});
</script>

<style lang="scss">
.balances-table {
  .table-body table thead tr {
    @apply relative left-0 top-0;
  }
  .table-body-col {
    @apply h-[53px] py-2;
  }
  .loading-row {
    .content-loader {
      @apply w-full;
    }
  }
  .load-all {
    @apply py-1.5 text-center;
    button {
      @apply h-[44px] rounded-md bg-primary-600 bg-opacity-[15%] p-2.5 text-primary-600 transition-colors hover:bg-opacity-10;
    }
  }
  .balance-data-symbol {
    @apply ml-2 inline-block min-w-[5rem] font-bold text-gray-700;
  }
  .balance-data-value {
    @apply font-bold text-gray-700;
  }
  .balance-data-price {
    @apply text-xs text-gray-400;
  }
  .token-icon a {
    @apply flex-row-reverse;
  }
  .balance-data-icon {
    @apply inline-block h-5 w-5 rounded-full;
  }
  .balances-not-found {
    @apply px-1.5 py-[1.9rem] text-gray-700;
  }
  .balances-error {
    @apply mt-0.5 px-1.5 py-2.5 text-gray-700;
  }
}
</style>
