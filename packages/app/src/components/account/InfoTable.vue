<template>
  <Table class="account-info-table" :items="tableInfoItems" :loading="loading">
    <template #table-row="{ item }: { item: any }">
      <TableBodyColumn>
        <span class="block-info-field-label">{{ item.label }}</span>
      </TableBodyColumn>
      <TableBodyColumn>
        <div class="block-info-field-value">
          <component v-if="item.component" :is="item.component" v-bind="item.value"></component>
          <template v-else>{{ item.value }}</template>
        </div>
      </TableBodyColumn>
    </template>
    <template #loading>
      <tr class="loading-row" v-for="row in 3" :key="row">
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

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import CopyContent from "@/components/common/table/fields/CopyContent.vue";

import type { Account } from "@/composables/useAddress";
import type { Component, PropType } from "vue";

const { t } = useI18n();
const props = defineProps({
  account: {
    type: Object as PropType<Account | null>,
    default: null,
  },
  loading: {
    type: Boolean,
    default: true,
  },
});

const tableInfoItems = computed(() => {
  if (!props.account) {
    return [];
  }
  type InfoTableItem = {
    label: string;
    value: string | number | null | Record<string, unknown>;
    component?: Component;
  };
  const tableItems: InfoTableItem[] = [
    { label: t("accountView.accountInfo.address"), value: { value: props.account.address }, component: CopyContent },
    { label: t("accountView.accountInfo.sealedNonce"), value: props.account.sealedNonce },
    { label: t("accountView.accountInfo.verifiedNonce"), value: props.account.verifiedNonce },
  ];
  return tableItems;
});
</script>

<style lang="scss">
.account-info-table {
  .table-body-col {
    @apply py-4;
  }
  tr:not(.loading-row) {
    td:nth-child(2) {
      @apply w-full;
    }
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

  .block-info-field-label {
    @apply text-gray-400;
  }

  .table-footer {
    .block-info-field-value {
      @apply text-gray-800;
    }
  }
}
</style>
