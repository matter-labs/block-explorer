<template>
  <Table
    :items="data"
    :loading="pending || !address"
    :class="{ empty: !data?.length }"
    class="internal-transactions-table"
  >
    <template #table-head v-if="data?.length">
      <TableHeadColumn>
        {{ t("internalTransactions.table.block") }}
      </TableHeadColumn>
      <TableHeadColumn>
        {{ t("internalTransactions.table.age") }}
      </TableHeadColumn>
      <TableHeadColumn>
        {{ t("internalTransactions.table.transactionHash") }}
      </TableHeadColumn>
      <TableHeadColumn>
        {{ t("internalTransactions.table.type") }}
      </TableHeadColumn>
      <TableHeadColumn>
        {{ t("internalTransactions.table.from") }}
      </TableHeadColumn>
      <TableHeadColumn>
        {{ t("internalTransactions.table.to") }}
      </TableHeadColumn>
      <TableHeadColumn>
        {{ t("internalTransactions.table.value") }}
      </TableHeadColumn>
    </template>

    <template #table-row="{ item }: { item: InternalTransaction }">
      <TableBodyColumn :data-heading="t('internalTransactions.table.block')">
        <router-link :to="{ name: 'block', params: { id: item.blockNumber } }">
          {{ item.blockNumber }}
        </router-link>
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('internalTransactions.table.age')">
        <TimeField :value="new Date(parseInt(item.timeStamp) * 1000).toISOString()" :format="TimeFormat.TIME_AGO" />
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('internalTransactions.table.transactionHash')">
        <router-link :to="{ name: 'transaction', params: { hash: item.hash } }">
          {{ shortenFitText(item.hash, "left") }}
        </router-link>
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('internalTransactions.table.type')">
        {{ item.type }}
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('internalTransactions.table.from')">
        <AddressLink :address="item.from">
          {{ shortenFitText(item.from, "left") }}
        </AddressLink>
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('internalTransactions.table.to')">
        <AddressLink :address="item.to">
          {{ shortenFitText(item.to, "left") }}
        </AddressLink>
      </TableBodyColumn>

      <TableBodyColumn :data-heading="t('internalTransactions.table.value')">
        <TokenAmountPriceTableCell :amount="item.value" :token="ethToken" :show-price="false" />
      </TableBodyColumn>
    </template>

    <template #empty>
      <EmptyState />
    </template>

    <template #loading>
      <LoadingState :size="pageSize" />
    </template>
  </Table>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import AddressLink from "@/components/AddressLink.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import { shortenFitText } from "@/components/common/HashLabel.vue";
import LoadingState from "@/components/common/LoadingState.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TableHeadColumn from "@/components/common/table/TableHeadColumn.vue";
import TimeField from "@/components/common/table/fields/TimeField.vue";
import TokenAmountPriceTableCell from "@/components/transactions/TokenAmountPriceTableCell.vue";

import useInternalTransactions, { type InternalTransaction } from "@/composables/useInternalTransactions";

import { TimeFormat } from "@/types";

const { t } = useI18n();

const props = defineProps({
  address: {
    type: String,
    required: true,
    default: () => null,
  },
});

const { data, load, pending, pageSize } = useInternalTransactions(computed(() => props.address));

const ethToken = {
  l2Address: "0x0000000000000000000000000000000000000000", // Placeholder or import constant
  symbol: "ETH",
  decimals: 18,
};

watch(
  () => props.address,
  () => {
    load(1);
  },
  { immediate: true }
);
</script>

<style lang="scss">
.internal-transactions-table {
  td {
    @apply relative flex flex-col items-end justify-end text-right md:table-cell md:h-[56.5px] md:text-left;
    &:before {
      @apply absolute left-4 top-3 whitespace-nowrap pr-5 text-left text-xs uppercase text-neutral-400 content-[attr(data-heading)] md:content-none;
    }
  }
}
</style>
