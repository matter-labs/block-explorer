<template>
  <Table class="batch-info-table" :items="items" :loading="loading">
    <template #table-row="{ item }: { item: any }">
      <template v-if="item.value !== undefined">
        <table-body-column v-if="item.label" class="batch-label-column">
          <span class="batch-info-field-label">{{ item.label }}</span>
          <InfoTooltip class="batch-info-field-tooltip">{{ item.tooltip }}</InfoTooltip>
        </table-body-column>
        <table-body-column
          class="batch-info-field-value-container"
          v-if="typeof item.value !== undefined && item.value !== null"
        >
          <div class="batch-info-field-value">
            <a v-if="item.url" :href="item.url" target="_blank">
              <component :is="item.component" v-bind="item.value" is-external-link></component>
            </a>
            <component v-else-if="item.component" :is="item.component" v-bind="item.value"></component>
            <template v-else>{{ item.value }}</template>
          </div>
        </table-body-column>
      </template>
    </template>
    <template #loading>
      <tr class="loading-row" v-for="row in loadingRowsAmount" :key="row">
        <TableBodyColumn>
          <ContentLoader />
        </TableBodyColumn>
        <TableBodyColumn>
          <ContentLoader />
        </TableBodyColumn>
      </tr>
    </template>
  </Table>
</template>

<script lang="ts" setup>
import InfoTooltip from "@/components/common/InfoTooltip.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";

import type { PropType } from "vue";

defineProps({
  items: {
    type: Array as PropType<unknown[]>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: true,
  },
  loadingRowsAmount: {
    type: Number,
    default: 5,
  },
});
</script>
<style lang="scss">
.batch-info-table {
  @apply h-max;
  .table-body {
    @apply rounded-t-lg;
  }
  .table-body-col {
    @apply py-[20px];
  }
  .loading-row {
    .table-body-col {
      @apply first:w-40;

      .content-loader {
        @apply w-full;

        &:nth-child(2) {
          @apply max-w-md;
        }
      }
    }
  }
  .batch-info-field-value-container {
    @apply w-full;
  }
  .batch-label-column {
    @apply flex items-center;

    .batch-info-field-label {
      @apply text-gray-400;
    }
    .batch-info-field-tooltip {
      @apply ml-1;
    }
  }
  .batch-info-field-value {
    @apply text-gray-800;
  }
}
</style>
