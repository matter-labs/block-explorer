<template>
  <Table class="contract-info-table" :loading="loading">
    <template v-if="!loading && contract" #default>
      <tr>
        <table-body-column class="contract-info-field-label">
          {{ t("contract.table.address") }}
        </table-body-column>
        <table-body-column class="contract-info-field-value">
          <CopyContent :value="contract.address" />
        </table-body-column>
      </tr>
      <tr>
        <table-body-column class="contract-info-field-label">
          {{ t("contract.table.creator") }}
        </table-body-column>
        <table-body-column class="contract-info-field-value">
          <AddressLink :address="contract.creatorAddress">
            {{ shortValue(contract.creatorAddress) }}
          </AddressLink>
          at
          <router-link :to="{ name: 'transaction', params: { hash: contract.creatorTxHash } }">
            {{ shortValue(contract.creatorTxHash, 20) }}
          </router-link>
        </table-body-column>
      </tr>
      <tr>
        <table-body-column class="contract-info-field-label">
          {{ t("contract.table.transactions") }}
        </table-body-column>
        <table-body-column class="contract-info-field-value">
          {{ contract.totalTransactions }}
        </table-body-column>
      </tr>
    </template>
    <template v-if="!loading && !contract" #empty>
      <TableBodyColumn colspan="3">
        <div class="contract-not-found">
          {{ t("transactions.table.notFound") }}
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

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import AddressLink from "@/components/AddressLink.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import CopyContent from "@/components/common/table/fields/CopyContent.vue";

import type { Contract } from "@/composables/useAddress";
import type { PropType } from "vue";

import { shortValue } from "@/utils/formatters";

defineProps({
  contract: {
    type: Object as PropType<Contract>,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: true,
  },
});

const { t } = useI18n();
</script>

<style scoped lang="scss">
.contract-info-table {
  .table-body-col {
    @apply py-4;
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
  .contract-info-field-label {
    @apply text-gray-400;
  }
  .contract-info-field-value {
    @apply text-gray-800;
  }

  .contract-not-found {
    @apply px-1.5 py-2 text-gray-700;
  }
}
</style>
