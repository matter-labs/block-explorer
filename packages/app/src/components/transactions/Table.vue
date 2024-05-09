<template>
  <Table class="transactions-table" :class="{ 'high-rows': isHighRowsSize }" :items="transactions" :loading="isLoading">
    <template v-if="transactions?.length || isLoading" #table-head>
      <TableHeadColumn v-if="columns.includes('status')">{{ t("transactions.table.status") }}</TableHeadColumn>
      <TableHeadColumn v-if="columns.includes('transactionHash')">
        {{ t("transactions.table.transactionHash") }}
      </TableHeadColumn>
      <TableHeadColumn v-if="columns.includes('method')">
        {{ t("transactions.table.method") }}
      </TableHeadColumn>
      <TableHeadColumn v-if="columns.includes('age')">
        {{ t("transactions.table.age") }}
      </TableHeadColumn>
      <TableHeadColumn v-if="columns.includes('from')" class="tablet-column-hidden">
        {{ t("transactions.table.from") }}
      </TableHeadColumn>
      <TableHeadColumn v-if="columns.includes('from') && columns.includes('to')" class="tablet-column">
        {{ t("transactions.table.from") }}/{{ t("transactions.table.to") }}
      </TableHeadColumn>
      <TableHeadColumn v-if="columns.includes('direction')" />
      <TableHeadColumn v-if="columns.includes('to')" class="tablet-column-hidden">
        {{ t("transactions.table.to") }}
      </TableHeadColumn>
      <TableHeadColumn v-if="columns.includes('value')" class="tablet-column-hidden">
        {{ t("transactions.table.value") }}
      </TableHeadColumn>
      <TableHeadColumn v-if="columns.includes('fee')" class="tablet-column-hidden">
        {{ t("transactions.table.fee") }}
      </TableHeadColumn>
      <TableHeadColumn v-if="columns.includes('value') && columns.includes('fee')" class="tablet-column">
        {{ t("transactions.table.value") }}/{{ t("transactions.table.fee") }}
      </TableHeadColumn>
    </template>
    <template #table-row="{ item }: { item: TransactionListItemMapped }">
      <TableBodyColumn
        v-if="columns.includes('status')"
        :data-heading="t('transactions.table.status')"
        class="status-col"
      >
        <Badge :color="item.statusColor" :data-testid="$testId.statusBadge">
          <template #default>
            <div class="inline-flex h-5 items-center">
              {{ te(`transactions.status.${item.status}`) ? t(`transactions.status.${item.status}`) : item.status }}
            </div>
            <component :is="item.statusIcon" class="w-4" />
          </template>
        </Badge>
      </TableBodyColumn>
      <TableBodyColumn v-if="columns.includes('transactionHash')" :data-heading="t('transactions.table.txnHash')">
        <span class="transactions-data-link">
          <router-link
            :data-testid="$testId.transactionsHash"
            :to="{
              name: 'transaction',
              params: { hash: item.hash },
            }"
          >
            {{ shortenFitText(item.hash, "left", 150) }}
          </router-link>
        </span>
      </TableBodyColumn>
      <TableBodyColumn v-if="columns.includes('method')" :data-heading="t('transactions.table.method')">
        <div class="transactions-data-method">
          <span :data-testid="$testId.transactionsMethodName">{{ item.methodName }}</span>
        </div>
      </TableBodyColumn>
      <TableBodyColumn
        v-if="columns.includes('age') && columns.length < 10"
        :data-heading="t('transactions.table.age')"
      >
        <CopyButton :value="utcStringFromISOString(item.receivedAt)">
          <TimeField :value="item.receivedAt" :show-exact-date="false" :data-testid="$testId.timestamp" />
        </CopyButton>
      </TableBodyColumn>
      <TableBodyColumn
        v-if="columns.includes('from')"
        :data-heading="t('transactions.table.from')"
        class="tablet-column-hidden"
      >
        <span class="transactions-data-link">
          <TransactionNetworkSquareBlock :network="item.fromNetwork" />
          <AddressLink
            :address="item.from"
            :network="item.fromNetwork"
            class="transactions-data-link-value"
            :data-testid="$testId.fromAddress"
          >
            {{ shortenFitText(item.from, "left", 125) }}
          </AddressLink>
        </span>
      </TableBodyColumn>
      <TableBodyColumn v-if="columns.includes('from') && columns.includes('to')" class="tablet-column">
        <div class="flex gap-x-2">
          <div class="text-neutral-400">
            <div>{{ t("transactions.table.from") }}</div>
            <div>{{ t("transactions.table.to") }}</div>
          </div>
          <div>
            <span class="transactions-data-link">
              <TransactionNetworkSquareBlock :network="item.fromNetwork" />
              <AddressLink
                :address="item.from"
                :network="item.fromNetwork"
                class="transactions-data-link-value"
                :data-testid="$testId.fromAddress"
              >
                {{ shortenFitText(item.from, "left", 125) }}
              </AddressLink>
            </span>
            <span class="transactions-data-link">
              <TransactionNetworkSquareBlock :network="item.toNetwork" />
              <AddressLink :address="item.to" :network="item.toNetwork" class="transactions-data-link-value">
                {{ shortenFitText(item.to, "left", 125) }}
              </AddressLink>
            </span>
          </div>
        </div>
      </TableBodyColumn>
      <TableBodyColumn v-if="columns.includes('direction')" :data-heading="t('transactions.table.direction')">
        <TransactionDirectionTableCell
          class="transactions-in-out"
          :text="getDirection(item)"
          :data-testid="$testId.direction"
        />
      </TableBodyColumn>
      <TableBodyColumn
        v-if="columns.includes('to')"
        :data-heading="t('transactions.table.to')"
        class="tablet-column-hidden"
      >
        <span class="transactions-data-link">
          <TransactionNetworkSquareBlock :network="item.toNetwork" />
          <AddressLink
            :data-testid="$testId.toAddress"
            :address="item.to"
            :network="item.toNetwork"
            class="transactions-data-link-value"
          >
            {{ shortenFitText(item.to, "left", 125) }}
          </AddressLink>
        </span>
      </TableBodyColumn>
      <TableBodyColumn
        v-if="columns.includes('value')"
        :data-heading="t('transactions.table.value')"
        class="tablet-column-hidden"
      >
        <TokenAmountPriceTableCell :token="zuluToken" :amount="item.value" :show-price="true" />
      </TableBodyColumn>
      <TableBodyColumn
        v-if="columns.includes('value') && columns.includes('fee')"
        :data-heading="t('transactions.table.value')"
        class="tablet-column"
      >
        <TokenAmountPriceTableCell :token="zuluToken" :amount="item.value" :show-price="false" />

        <div class="tablet-column-fee">
          {{ t("transactions.table.fee") }}:&nbsp;
          <TokenAmountPriceTableCell :token="zuluToken" :amount="item.fee" :show-price="false" />
        </div>
      </TableBodyColumn>
      <TableBodyColumn
        v-if="columns.includes('fee')"
        :data-heading="t('transactions.table.fee')"
        class="tablet-column-hidden"
      >
        <TokenAmountPriceTableCell :token="zuluToken" :amount="item.fee" :show-price="true" />
      </TableBodyColumn>
    </template>
    <template #empty>
      <TableBodyColumn class="transactions-not-found" :colspan="columns.length">
        <slot name="not-found">{{ t("transactions.table.notFound") }}</slot>
      </TableBodyColumn>
    </template>
    <template v-if="pagination && total && total > pageSize && transactions?.length" #footer>
      <div class="pagination">
        <Pagination
          v-model:active-page="activePage"
          :use-query="useQueryPagination"
          :total-items="total!"
          :page-size="pageSize"
          :disabled="isLoading"
        />
      </div>
    </template>
    <template #loading>
      <tr class="loader-row" v-for="row in pageSize" :key="row">
        <TableBodyColumn v-for="(col, index) in columns" :key="`col-${index}`" class="loader-col">
          <ContentLoader />
        </TableBodyColumn>
      </tr>
    </template>
  </Table>
</template>

<script setup lang="ts">
import { computed, type PropType, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import AddressLink from "@/components/AddressLink.vue";
import Badge from "@/components/common/Badge.vue";
import CopyButton from "@/components/common/CopyButton.vue";
import { shortenFitText } from "@/components/common/HashLabel.vue";
import Pagination from "@/components/common/Pagination.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TableHeadColumn from "@/components/common/table/TableHeadColumn.vue";
import TimeField from "@/components/common/table/fields/TimeField.vue";
import ZuluCircleIcon from "@/components/icons/ZuluCircle.vue";
import TokenAmountPriceTableCell from "@/components/transactions/TokenAmountPriceTableCell.vue";
import TransactionDirectionTableCell from "@/components/transactions/TransactionDirectionTableCell.vue";
import TransactionNetworkSquareBlock from "@/components/transactions/TransactionNetworkSquareBlock.vue";

import useToken, { type Token } from "@/composables/useToken";
import { decodeDataWithABI } from "@/composables/useTransactionData";
import useTransactions, { type TransactionListItem, type TransactionSearchParams } from "@/composables/useTransactions";

import type { Direction } from "@/components/transactions/TransactionDirectionTableCell.vue";
import type { AbiFragment } from "@/composables/useAddress";
import type { NetworkOrigin } from "@/types";

import { ZULU_TOKEN_L2_ADDRESS } from "@/utils/constants";
import { utcStringFromISOString } from "@/utils/helpers";

const { t, te } = useI18n();

const props = defineProps({
  columns: {
    type: Array as PropType<string[]>,
    default: () => ["status", "transactionHash", "method", "age", "from", "direction", "to", "value", "fee"],
  },
  contractAbi: {
    type: Array as PropType<AbiFragment[]>,
  },
  searchParams: {
    type: Object as PropType<TransactionSearchParams>,
  },
  pagination: {
    type: Boolean,
    default: true,
  },
  useQueryPagination: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const searchParams = computed(() => props.searchParams ?? {});
const { data, load, total, pending, pageSize } = useTransactions(searchParams);

const { getTokenInfo, tokenInfo, isRequestPending: isLoadingEthTokenInfo } = useToken();
getTokenInfo(ZULU_TOKEN_L2_ADDRESS);

const zuluToken = computed<Token | null>(() => {
  return tokenInfo.value;
});

const isLoading = computed(() => pending.value || isLoadingEthTokenInfo.value);

const activePage = ref(props.useQueryPagination ? parseInt(route.query.page as string) || 1 : 1);
const toDate = new Date();

watch(
  [activePage, searchParams],
  ([page]) => {
    load(page, toDate);
  },
  { immediate: true }
);

const getTransactionMethod = (transaction: TransactionListItem) => {
  if (transaction.data === "0x") {
    return t("transactions.table.transferMethodName");
  }
  const sighash = transaction.data.slice(0, 10);
  if (props.contractAbi) {
    return (
      decodeDataWithABI(
        {
          calldata: transaction.data,
          value: transaction.value,
        },
        props.contractAbi
      )?.name ?? sighash
    );
  }
  return sighash;
};

type TransactionListItemMapped = TransactionListItem & {
  methodName: string;
  fromNetwork: NetworkOrigin;
  toNetwork: NetworkOrigin;
  statusIcon: unknown;
  statusColor: "danger" | "dark-success";
};

// @todo: support for bitcoin verify
const transactions = computed<TransactionListItemMapped[] | undefined>(() => {
  return data.value?.map((transaction) => ({
    ...transaction,
    methodName: getTransactionMethod(transaction),
    fromNetwork: transaction.isL1Originated ? "L1" : "L2",
    toNetwork: "L2", // even withdrawals go through L2 addresses (800A or bridge addresses)
    statusColor: transaction.status === "failed" ? "danger" : "dark-success",
    statusIcon: ["failed", "included"].includes(transaction.status) ? ZuluCircleIcon : "span",
  }));
});

const isHighRowsSize = computed(() => props.columns.includes("fee"));

function getDirection(item: TransactionListItem): Direction {
  return item.from === item.to ? "self" : item.to !== props.searchParams?.address ? "out" : "in";
}
</script>

<style lang="scss">
.transactions-table {
  &.high-rows {
    .loader-row .content-loader {
      @apply md:my-2;
    }
  }
  th,
  td {
    &:nth-child(1) {
      @apply min-w-[7rem];

      &.loader-col .content-loader {
        @apply w-[7rem];
      }
    }
    &:nth-child(2) {
      @apply min-w-[6.5rem];

      &.loader-col .content-loader {
        @apply w-[6.5rem];
      }
    }
    &:nth-child(3) {
      @apply min-w-[5rem];

      &.loader-col .content-loader {
        @apply w-[4rem];
      }
    }
    &:nth-child(4) {
      @apply min-w-[4.5rem];

      &.loader-col .content-loader {
        @apply w-[4.5rem];
      }
    }
    &:nth-child(5) {
      @apply min-w-[6.5rem];

      &.loader-col .content-loader {
        @apply w-[6.5rem];
      }
    }
    &:nth-child(6) {
      @apply min-w-[4rem];

      &.loader-col .content-loader {
        @apply w-[4rem];
      }
    }
    &:nth-child(7) {
      @apply min-w-[4rem];

      &.loader-col .content-loader {
        @apply w-[4rem];
      }
    }
    &:nth-child(8) {
      @apply min-w-[6rem];

      &.loader-col .content-loader {
        @apply w-[6rem];
      }
    }
    &:nth-child(9) {
      @apply min-w-[7.4rem];

      &.loader-col .content-loader {
        @apply w-[7.4rem];
      }
    }
  }
  .dash-icon {
    @apply h-4 w-4;
  }
  .table-body-col {
    @apply min-h-[36px] py-2 md:py-3.5;
  }
  .loader-row {
    .content-loader {
      @apply float-right h-6 w-full md:float-none;
    }
  }
  .tablet-column {
    @apply hidden md:table-cell lg:hidden;
    .tablet-column-fee {
      @apply flex text-xs text-neutral-400;
    }
  }
  .only-desktop {
    @apply hidden md:table-cell;
  }
  .table-initiator-container {
    @apply gap-x-1 text-neutral-400;
    a {
      @apply font-medium;
    }
  }
  .tablet-column-hidden {
    @apply md:hidden lg:table-cell;
  }
  .amount-price-placeholder {
    @apply text-xs md:hidden;
  }
  .transactions-data-link {
    @apply flex items-center gap-x-1;
    a,
    .transactions-data-link-value {
      @apply block cursor-pointer text-sm font-medium;
    }
    span.transactions-data-link-value {
      @apply cursor-default;
    }
  }
  .transactions-data-method {
    @apply w-[200px] truncate sm:w-auto;
  }
  .transactions-data-transaction-amount,
  .transactions-data-age {
    @apply flex items-center text-sm;
  }
  .transaction-data-block {
    @apply font-semibold;
  }
  .transactions-in-out {
    @apply md:m-auto;
  }
  .transactions-data-transaction-amount {
    @apply font-bold;
  }
  .transactions-not-found {
    @apply my-0 table-cell items-start justify-start bg-white p-4 text-left text-gray-700;
  }
  .badge-content {
    @apply flex items-center;

    svg {
      @apply ml-1;
    }
  }
  .badge-container.type-label {
    @apply pr-2 normal-case	normal-case;
  }

  .pagination {
    @apply flex justify-center p-3;
  }

  .table-body {
    @apply rounded-t-lg;
    th.table-head-col {
      @apply min-w-0 sm:min-w-[7rem];
    }
  }
  td {
    @apply relative flex flex-col items-end justify-end text-right md:table-cell md:text-left;
    &:before {
      @apply absolute left-4 top-3 whitespace-nowrap pr-5 text-left text-xs uppercase text-neutral-400 content-[attr(data-heading)] md:content-none;
    }
  }
  .copy-button-container {
    @apply flex w-fit;
    .copy-button {
      @apply static p-0 focus:ring-0;
    }
  }
}
</style>
