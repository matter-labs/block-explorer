<template>
  <Table class="token-info-table" :loading="loading">
    <template v-if="!loading && tokenInfo" #default>
      <tr>
        <table-body-column class="token-info-field-label">
          {{ t("tokenView.table.market.marketCap") }}
        </table-body-column>
        <table-body-column class="token-info-field-value">
          <div v-if="tokenInfo.liquidity && tokenInfo.usdPrice">
            {{ formatMoney(tokenInfo.liquidity, tokenInfo.decimals) }}
          </div>
        </table-body-column>
      </tr>
      <tr>
        <table-body-column class="token-info-field-label">
          {{ t("tokenView.table.market.price") }}
        </table-body-column>
        <table-body-column class="contract-info-field-value">
          <TokenPrice :address="tokenInfo.l2Address" />
        </table-body-column>
      </tr>
    </template>
    <template v-if="!loading && !tokenInfo" #empty>
      <TableBodyColumn colspan="3">
        <div class="token-not-found">
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

import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TokenPrice from "@/components/common/table/fields/TokenPrice.vue";

import type { Token } from "@/composables/useToken";
import type { PropType } from "vue";

import { formatMoney } from "@/utils/formatters";

defineProps({
  tokenInfo: {
    type: Object as PropType<Token>,
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
.token-info-table {
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
  .token-info-field-label {
    @apply text-gray;
  }
  .token-info-field-value {
    @apply text-gray-4;
  }

  .token-not-found {
    @apply px-1.5 py-2 text-gray-3;
  }
}
</style>
