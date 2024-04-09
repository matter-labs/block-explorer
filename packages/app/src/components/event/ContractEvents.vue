<template>
  <Table
    class="contract-events-container"
    :items="collection"
    :loading="isRequestPending"
    :class="{ empty: !collection?.length }"
  >
    <template v-if="total > 0 && collection?.length" #table-head>
      <TableHeadColumn v-for="item in tableHead" :key="item">{{ item }}</TableHeadColumn>
    </template>

    <template #table-row="{ item, index }: { item: any, index: number }">
      <TableBodyColumn class="first-col" :data-heading="tableHead[0]">
        <router-link :to="{ name: 'transaction', params: { hash: item.transactionHash } }">
          <HashLabel :text="item.transactionHash" placement="left" />
        </router-link>
        <span>
          #<router-link :to="{ name: 'block', params: { id: item.blockNumber } }">
            {{ item.blockNumber }}
          </router-link>
        </span>
      </TableBodyColumn>
      <TableBodyColumn :data-heading="tableHead[1]">
        <span v-if="item.event">{{ item.event.name }}</span>
        <div v-else>
          <MinusIcon class="dash-icon" />
        </div>
      </TableBodyColumn>
      <TableBodyColumn :data-heading="t('contract.events.logs')" class="only-mobile mb-6"></TableBodyColumn>
      <TableBodyColumn class="last-col">
        <TransactionEventTableCell
          :item="item"
          :popover-placement="index === collection.length - 1 ? 'top' : 'bottom'"
        />
      </TableBodyColumn>
    </template>
    <template #empty>
      <ContractEventsEmptyState />
    </template>
    <template v-if="total > 25 && collection?.length" #footer>
      <div class="pagination">
        <Pagination
          v-model:active-page="activePage"
          :use-query="false"
          :total-items="total"
          :page-size="pageSize"
          :disabled="isRequestPending"
        />
      </div>
    </template>
    <template #loading>
      <tr class="loading-container">
        <TableBodyColumn :data-heading="tableHead[0]" class="loading-first-col">
          <ContentLoader />
          <ContentLoader />
        </TableBodyColumn>
        <TableBodyColumn :data-heading="tableHead[1]" class="loading-second-col">
          <ContentLoader />
        </TableBodyColumn>
        <TableBodyColumn class="only-mobile" :data-heading="t('contract.events.logs')"></TableBodyColumn>
        <TableBodyColumn class="loading-last-col">
          <ContentLoader v-for="col in 5" :key="col" />
        </TableBodyColumn>
      </tr>
    </template>
  </Table>
</template>
<script lang="ts" setup>
import { computed, type PropType, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { MinusIcon } from "@heroicons/vue/outline";

import HashLabel from "@/components/common/HashLabel.vue";
import Pagination from "@/components/common/Pagination.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TableHeadColumn from "@/components/common/table/TableHeadColumn.vue";
import ContractEventsEmptyState from "@/components/event/ContractEventsEmptyState.vue";
import TransactionEventTableCell from "@/components/event/TransactionEventTableCell.vue";

import useContractEvents from "@/composables/useContractEvents";

import type { Contract } from "@/composables/useAddress";

const { t } = useI18n();

const props = defineProps({
  contract: {
    type: Object as PropType<Contract>,
    required: true,
    default: () => ({}),
  },
});

const { collection, getCollection, total, isRequestPending } = useContractEvents();

const pageSize = ref<number>(25);
const tableHead = computed(() => [
  t("contract.events.txnHash"),
  t("contract.events.method"),
  t("contract.events.logs"),
]);

const activePage = ref(1);
const toDate = new Date();
watch(
  [activePage, () => props.contract.address],
  ([page]) => {
    getCollection(
      {
        contractAddress: props.contract.address,
        page: page,
        pageSize: pageSize.value,
        toDate: toDate,
      },
      props.contract.verificationInfo?.artifacts.abi
    );
  },
  { immediate: true }
);
</script>
<style lang="scss">
.contract-events-container {
  @apply rounded-t-none bg-white shadow-none md:rounded;
  table {
    thead {
      tr {
        th.table-head-col {
          @apply first:rounded-t-none last:rounded-t-none;
        }
      }
    }
    tr {
      @apply align-baseline;
      .table-body-col {
        @apply py-2 md:py-4;
      }
    }
    td {
      @apply relative flex flex-col items-end text-right last:text-left md:table-cell md:text-left;
      &:before {
        @apply absolute left-4 top-2.5 whitespace-nowrap pr-5 text-left text-xs uppercase text-neutral-400 content-[attr(data-heading)] md:content-none;
      }
    }
  }

  .first-col {
    @apply overflow-hidden text-neutral-600;
    a {
      @apply mb-2 inline md:inline-block;
    }
    > span {
      @apply flex;
    }
  }
  .last-col {
    @apply block;
  }
  .pagination {
    @apply flex justify-center p-3;
  }
  .only-mobile {
    @apply flex md:hidden;
  }
  .only-desktop {
    @apply hidden md:flex;
  }
  .dash-icon {
    @apply m-auto h-4 w-4;
  }
  .loading-container {
    .table-body-col {
      @apply w-auto;
    }
    .loading-first-col {
      @apply w-auto md:w-72;
      .content-loader {
        @apply first:w-48 last:w-28 first:md:w-auto last:md:w-32;
      }
    }
    .loading-second-col {
      @apply w-auto md:w-40;
      .content-loader {
        @apply w-28 md:w-auto;
      }
    }
    .loading-last-col {
      .content-loader {
        @apply w-full first:mt-4 md:w-auto;
      }
    }
    .content-loader {
      @apply mb-4;
    }
  }
}
.empty {
  @apply rounded-t-none;
}
</style>
