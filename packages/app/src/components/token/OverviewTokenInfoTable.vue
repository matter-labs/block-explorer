<template>
  <Table class="token-info-table" :loading="loading">
    <template v-if="!loading && tokenOverview && tokenInfo" #default>
      <tr>
        <table-body-column class="token-info-field-label">
          {{ t("tokenView.table.overview.maxTotalSupply") }}
        </table-body-column>
        <table-body-column class="token-info-field-value">
          {{ formatValue(tokenOverview.maxTotalSupply, tokenInfo.decimals) }}
        </table-body-column>
      </tr>
      <tr>
        <table-body-column class="token-info-field-label">
          {{ t("tokenView.table.overview.holders") }}
        </table-body-column>
        <table-body-column class="contract-info-field-value">
          {{ tokenOverview.holders }}
        </table-body-column>
      </tr>
      <tr>
        <table-body-column class="token-info-field-label">
          {{ t("tokenView.table.overview.tokenContract") }}
        </table-body-column>
        <table-body-column class="contract-info-field-value">
          <AddressLink :address="tokenInfo.l2Address" class="block max-w-sm" :data-testid="$testId.tokenHoldersAddress">
            {{ shortenFitText(tokenInfo.l2Address, "left", 210, subtraction) }}
          </AddressLink>
        </table-body-column>
      </tr>
    </template>
    <template v-if="!loading && !tokenOverview" #empty>
      <TableBodyColumn colspan="3">
        <div class="token-not-found">
          {{ t("transactions.table.notFound") }}
        </div>
      </TableBodyColumn>
    </template>
    <template #loading>
      <tr class="loading-row" v-for="row in 4" :key="row">
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
import { type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import AddressLink from "@/components/AddressLink.vue";
import { shortenFitText } from "@/components/common/HashLabel.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";

import type { Token } from "@/composables/useToken";
import type { TokenOverview } from "@/composables/useTokenOverview";

import { formatValue } from "@/utils/formatters";

defineProps({
  tokenOverview: {
    type: Object as PropType<TokenOverview>,
    default: () => ({}),
  },
  tokenInfo: {
    type: Object as PropType<Token>,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: true,
  },
});

const subtraction = ref(6);
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
    @apply text-gray-400;
  }
  .token-info-field-value {
    @apply text-gray-800;
  }

  .token-not-found {
    @apply px-1.5 py-2 text-gray-700;
  }
}
</style>
