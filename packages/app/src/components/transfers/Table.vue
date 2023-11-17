<template>
  <Table :items="data" :loading="pending || !address" :class="{ empty: !data?.length }" class="transfers-table">
    <template #table-head v-if="total && total > 0">
      <TableHeadColumn>
        {{ t("transfers.table.transactionHash") }}
      </TableHeadColumn>
      <TableHeadColumn>
        {{ t("transfers.table.age") }}
      </TableHeadColumn>
      <TableHeadColumn>
        {{ t("transfers.table.type") }}
      </TableHeadColumn>
      <TableHeadColumn class="tablet-column-hidden">
        {{ t("transfers.table.from") }}
      </TableHeadColumn>
      <TableHeadColumn class="tablet-column">
        {{ t("transfers.table.from") }}/{{ t("transfers.table.to") }}
      </TableHeadColumn>
      <TableHeadColumn />
      <TableHeadColumn class="tablet-column-hidden">
        {{ t("transfers.table.to") }}
      </TableHeadColumn>

      <TableHeadColumn>
        {{ t("transfers.table.amount") }}
      </TableHeadColumn>
    </template>

    <template #table-row="{ item }: { item: Transfer }">
      <TableBodyColumn :data-heading="t('transfers.table.transactionHash')" class="tx-hash">
        <router-link
          :data-testid="$testId.transactionsHash"
          :to="{
            name: 'transaction',
            params: { hash: item.transactionHash },
          }"
          v-if="item.transactionHash"
        >
          {{ shortenFitText(item.transactionHash, "left") }}
        </router-link>
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('transfers.table.age')">
        <CopyButton :value="utcStringFromISOString(item.timestamp)">
          <TimeField :data-testid="$testId.timestamp" :value="item.timestamp" :show-exact-date="false" />
        </CopyButton>
      </TableBodyColumn>
      <TableBodyColumn :data-heading="t('transfers.table.type')" class="transfer-type">
        <span :data-testid="$testId.transferType">{{ item.type }}</span>
      </TableBodyColumn>
      <TableBodyColumn :data-heading="t('transfers.table.from')" class="tablet-column-hidden">
        <span class="transfers-data-link">
          <TransactionNetworkSquareBlock :network="item.fromNetwork" :data-testid="$testId.transferFromOriginTablet" />
          <AddressLink
            :data-testid="$testId.fromAddress"
            :address="item.from"
            :network="item.fromNetwork"
            class="transfers-data-link-value"
          >
            {{ shortenFitText(item.from, "left") }}
          </AddressLink>
        </span>
      </TableBodyColumn>
      <TableBodyColumn class="tablet-column">
        <div class="flex gap-x-2">
          <div class="text-neutral-400">
            <div>{{ t("transfers.table.from") }}</div>
            <div>{{ t("transfers.table.to") }}</div>
          </div>
          <div>
            <div>
              <span class="transfers-data-link">
                <TransactionNetworkSquareBlock :network="item.fromNetwork" :data-testid="$testId.transferFromOrigin" />
                <AddressLink :address="item.from" :network="item.fromNetwork" class="transfers-data-link-value">
                  {{ shortenFitText(item.from, "left") }}
                </AddressLink>
              </span>
            </div>
            <div>
              <span class="transfers-data-link">
                <TransactionNetworkSquareBlock :network="item.toNetwork" :data-testid="$testId.transferToOrigin" />
                <AddressLink :address="item.to" :network="item.toNetwork" class="transfers-data-link-value">
                  {{ shortenFitText(item.to, "left") }}
                </AddressLink>
              </span>
            </div>
          </div>
        </div>
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('transfers.table.direction')">
        <TransactionDirectionTableCell
          :data-testid="$testId.direction"
          class="transfers-in-out"
          :text="getTransferDirection(item)"
        />
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('transfers.table.to')" class="tablet-column-hidden">
        <span class="transfers-data-link">
          <TransactionNetworkSquareBlock :network="item.toNetwork" :data-testid="$testId.transferToOriginTablet" />
          <AddressLink
            :data-testid="$testId.toAddress"
            :address="item.to"
            :network="item.toNetwork"
            class="transfers-data-link-value"
          >
            {{ shortenFitText(item.to, "left") }}
          </AddressLink>
        </span>
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('transfers.table.amount')">
        <TokenAmountPriceTableCell :amount="item.amount" :token="item.token" :show-price="true" />
      </TableBodyColumn>
    </template>
    <template #empty>
      <EmptyState />
    </template>
    <template v-if="total && total > pageSize && data?.length" #footer>
      <div class="pagination">
        <Pagination
          v-model:active-page="activePage"
          :use-query="false"
          :total-items="total!"
          :page-size="pageSize"
          :disabled="pending"
        />
      </div>
    </template>
    <template #loading>
      <LoadingState :size="pageSize" />
    </template>
  </Table>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import EmptyState from "./EmptyState.vue";
import LoadingState from "./LoadingState.vue";

import AddressLink from "@/components/AddressLink.vue";
import CopyButton from "@/components/common/CopyButton.vue";
import { shortenFitText } from "@/components/common/HashLabel.vue";
import Pagination from "@/components/common/Pagination.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TableHeadColumn from "@/components/common/table/TableHeadColumn.vue";
import TimeField from "@/components/common/table/fields/TimeField.vue";
import TokenAmountPriceTableCell from "@/components/transactions/TokenAmountPriceTableCell.vue";
import TransactionDirectionTableCell, {
  type Direction,
} from "@/components/transactions/TransactionDirectionTableCell.vue";
import TransactionNetworkSquareBlock from "@/components/transactions/TransactionNetworkSquareBlock.vue";

import useTransfers, { type Transfer } from "@/composables/useTransfers";

import { utcStringFromISOString } from "@/utils/helpers";

const { t } = useI18n();

const props = defineProps({
  address: {
    type: String,
    required: true,
    default: () => null,
  },
});

const { data, load, total, pending, pageSize } = useTransfers(
  computed(() => {
    return props.address;
  })
);

function getTransferDirection(item: Transfer): Direction {
  return item.from === item.to ? "self" : item.to !== props.address ? "out" : "in";
}

const activePage = ref(1);
const toDate = new Date();

watch(
  [activePage, () => props.address],
  ([page]) => {
    load(page, toDate);
  },
  { immediate: true }
);
</script>

<style lang="scss">
.transfers-table {
  .table-body {
    th.table-head-col {
      @apply min-w-0 sm:min-w-[7rem];
    }
  }

  td {
    @apply relative flex flex-col items-end justify-end text-right md:table-cell md:h-[56.5px] md:text-left;
    &:before {
      @apply absolute left-4 top-3 whitespace-nowrap pr-5 text-left text-xs uppercase text-neutral-400 content-[attr(data-heading)] md:content-none;
    }
  }

  &.has-head {
    table thead tr th {
      @apply first:rounded-none last:rounded-none;
    }
  }

  .tablet-column {
    @apply hidden md:table-cell lg:hidden;
  }
  .tablet-column-hidden {
    @apply md:hidden lg:table-cell;
  }

  .pagination {
    @apply flex justify-center p-3;
  }

  .transfer-type {
    @apply capitalize;
  }

  .copy-button-container {
    @apply flex w-fit;
    .copy-button {
      @apply static p-0 focus:ring-0;
    }
  }

  .transfers-in-out {
    @apply md:m-auto;
  }

  .transfers-data-link {
    @apply flex items-center gap-x-1;
    a,
    .transfers-data-link-value {
      @apply block cursor-pointer text-sm font-medium;
    }
    span.transfers-data-link-value {
      @apply cursor-default;
    }
  }
}
</style>
