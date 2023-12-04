<template>
  <Table class="block-info-table" :items="items" :loading="loading">
    <template #table-row="{ item }: { item: any }">
      <template v-if="item.value !== undefined">
        <table-body-column v-if="item.label" class="block-label-column">
          <span class="block-info-field-label">{{ item.label }}</span>
          <InfoTooltip class="block-info-field-tooltip">{{ item.tooltip }}</InfoTooltip>
        </table-body-column>
        <table-body-column
          class="block-info-field-value-container"
          v-if="typeof item.value !== undefined && item.value !== null"
        >
          <div class="block-info-field-value">
            <a v-if="item.url" :href="item.url" target="_blank">
              <component :is="item.component" v-bind="item.value" is-external-link></component>
            </a>
            <span v-else-if="item.route">
              <Tooltip v-if="item.route.disabled">
                <span>{{ item.value }}</span>
                <template #content>{{ item.route.disabledTooltip }}</template>
              </Tooltip>
              <router-link v-else :to="{ name: item.route.name, params: item.route.params }">
                {{ item.value }}
              </router-link>
            </span>
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
import Tooltip from "@/components/common/Tooltip.vue";
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
    default: 6,
  },
});
</script>
<style lang="scss">
.block-info-table {
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
  .block-info-field-value-container {
    @apply w-full;
  }
  .block-label-column {
    @apply flex items-center;

    .block-info-field-label {
      @apply text-gray-400;
    }
    .block-info-field-tooltip {
      @apply ml-1;
    }
  }
  .block-info-field-value {
    @apply text-gray-800;
  }
}
</style>
