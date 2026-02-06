<template>
  <Table class="blocks-table" :class="{ loading }" :items="blocks" :loading="loading">
    <template v-if="blocks?.length || loading" #table-head>
      <TableHeadColumn>{{ t("blocks.table.block") }}</TableHeadColumn>
      <TableHeadColumn>{{ t("blocks.table.status") }}</TableHeadColumn>
      <TableHeadColumn>{{ t("blocks.table.age") }}</TableHeadColumn>
    </template>
    <template #loading>
      <tr class="loader-row" v-for="item in loadingRows" :key="item">
        <TableBodyColumn :data-heading="t('blocks.table.block')">
          <div class="blocks-number-container">
            <div class="h-8 w-8 animate-pulse rounded-full bg-neutral-200"></div>
            <div class="blocks-number-right">
              <ContentLoader class="block-data-number w-14" />
              <ContentLoader class="block-data-txns-amount w-10" />
            </div>
          </div>
        </TableBodyColumn>
        <TableBodyColumn :data-heading="t('blocks.table.status')">
          <ContentLoader class="h-4 w-14" />
        </TableBodyColumn>
        <TableBodyColumn :data-heading="t('blocks.table.age')">
          <div class="py-1">
            <ContentLoader class="h-3 w-36" />
          </div>
        </TableBodyColumn>
      </tr>
    </template>
    <template #table-row="{ item }: { item: any }">
      <TableBodyColumn :data-heading="t('blocks.table.block')">
        <div class="blocks-number-container">
          <div class="blocks-number-icon-container">
            <CubeIcon class="h-5 w-5 text-white" />
          </div>
          <div class="blocks-number-right">
            <div class="block-data-number">
              <router-link :data-testid="$testId.blocksNumber" :to="{ name: 'block', params: { id: item.number } }">
                #{{ item.number }}
              </router-link>
            </div>
            <div class="block-data-txns-amount">
              {{ item.l1TxCount + item.l2TxCount }} {{ t("blocks.table.transactionsShort") }}
            </div>
          </div>
        </div>
      </TableBodyColumn>
      <TableBodyColumn :data-heading="t('blocks.table.status')">
        <span class="block-data-status">{{ t(`blocks.status.${item.status}`) }}</span>
      </TableBodyColumn>
      <TableBodyColumn :data-heading="t('blocks.table.age')">
        <CopyButton :value="item.timestamp">
          <TimeField :value="item.timestamp" :format="TimeFormat.TIME_AGO" />
        </CopyButton>
      </TableBodyColumn>
    </template>
    <template #empty>
      <TableBodyColumn class="blocks-not-found" :colspan="3">
        <slot name="not-found">{{ t("blocks.table.notFound") }}</slot>
      </TableBodyColumn>
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </Table>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { CubeIcon } from "@heroicons/vue/outline";

import CopyButton from "@/components/common/CopyButton.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TableHeadColumn from "@/components/common/table/TableHeadColumn.vue";
import TimeField from "@/components/common/table/fields/TimeField.vue";

import type { BlockListItem } from "@/composables/useBlock";
import type { PropType } from "vue";

import { TimeFormat } from "@/types";

const { t } = useI18n();

defineProps({
  blocks: {
    type: Array as PropType<BlockListItem[]>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: true,
  },
  loadingRows: {
    type: Number,
    default: 10,
  },
});
</script>

<style lang="scss">
.blocks-table {
  &.loading {
    .table-body td::before {
      @apply opacity-30;
    }
  }
  .blocks-number-container {
    @apply flex items-center;

    .blocks-number-icon-container {
      @apply flex h-8 w-8 items-center justify-center rounded-full bg-gray-800;
    }
    .blocks-number-right {
      @apply ml-3;

      .block-data-number {
        @apply font-bold text-gray-700;

        a {
          @apply font-medium;
        }
      }
      .block-data-txns-amount {
        @apply float-right text-xs text-gray-400 md:float-none;
      }
    }
  }
  .block-data-status {
    @apply text-xs font-bold capitalize text-gray-700;
  }
  .table-body {
    @apply rounded-t-lg;

    td {
      @apply relative flex flex-col items-end justify-end whitespace-normal text-right md:table-cell md:py-2.5 md:text-left;

      &:before {
        @apply absolute left-4 top-2 whitespace-nowrap pr-5 text-left text-xs uppercase text-neutral-400 content-[attr(data-heading)] md:content-none;
      }
    }
  }
  td.blocks-not-found {
    @apply my-0 table-cell items-start justify-start bg-white p-4 text-left text-gray-700;
  }
  .copy-button-container {
    @apply flex w-fit;
    .copy-button {
      @apply static p-0 focus:ring-0;
    }
  }
}
</style>
