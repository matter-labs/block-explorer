<template>
  <Table :data-testid="$testId.tokensHoldersTable" :loading="isLoading" :items="tokenHolders" ref="table">
    <template v-if="tokenHolders?.length || isLoading" #table-head>
      <table-head-column>{{ t("tokenHolders.table.address") }}</table-head-column>
      <table-head-column>{{ t("tokenHolders.table.balance") }}</table-head-column>
      <table-head-column>{{ t("tokenHolders.table.percentage") }}</table-head-column>
      <table-head-column>{{ t("tokenHolders.table.value") }}</table-head-column>
    </template>
    <template #table-row="{ item }: { item: any }">
      <TableBodyColumn :data-heading="t('tokenHolders.table.address')">
        <div class="holder-address-container">
          <AddressLink :address="item.address" class="block max-w-sm" :data-testid="$testId.tokenHoldersAddress">
            {{ shortenFitText(item.address, "left", 210, subtraction) }}
          </AddressLink>
          <CopyButton :value="item.address" />
        </div>
      </TableBodyColumn>
      <TableBodyColumn :data-heading="t('tokenHolders.table.balance')">
        <div :data-testid="$testId.tokenHoldersBalance" class="balance-data-value">
          {{ formatValue(item.balance, tokenInfo.decimals) }}
        </div>
      </TableBodyColumn>
      <TableBodyColumn :data-testid="$testId.tokenHoldersPercentage" :data-heading="t('tokenHolders.table.percentage')">
        {{ item.percentage }}
      </TableBodyColumn>
      <TableBodyColumn :data-heading="t('tokenHolders.table.value')">
        <div class="balance-data-price">
          <div :data-testid="$testId.tokenHoldersValue">
            {{
              tokenInfo.usdPrice && item.balance
                ? formatPricePretty(item.balance, tokenInfo.decimals, tokenInfo.usdPrice.toString())
                : ""
            }}
          </div>
        </div>
      </TableBodyColumn>
    </template>
    <template v-if="pagination && total && total > pageSize && tokenHolders?.length" #footer>
      <Pagination
        v-model:active-page="activePage"
        :use-query="useQueryPagination"
        :total-items="total!"
        :page-size="pageSize"
        :disabled="isLoading"
      />
    </template>
    <template #loading>
      <tr class="loading-row" v-for="row in 4" :key="row">
        <TableBodyColumn class="w-16">
          <ContentLoader />
        </TableBodyColumn>
        <TableBodyColumn>
          <ContentLoader />
        </TableBodyColumn>
        <TableBodyColumn>
          <ContentLoader />
        </TableBodyColumn>
        <TableBodyColumn>
          <ContentLoader />
        </TableBodyColumn>
      </tr>
    </template>
    <template #empty>
      <TableBodyColumn class="holders-not-found">
        <slot name="not-found">{{ t("transactions.table.notFound") }}</slot>
      </TableBodyColumn>
    </template>
  </Table>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import AddressLink from "@/components/AddressLink.vue";
import CopyButton from "@/components/common/CopyButton.vue";
import { shortenFitText } from "@/components/common/HashLabel.vue";
import Pagination from "@/components/common/Pagination.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TableHeadColumn from "@/components/common/table/TableHeadColumn.vue";

import useTokenHolders from "@/composables/useTokenHolders";
import { type TokenOverview } from "@/composables/useTokenOverview";

import type { Token } from "@/composables/useToken";
import type { TokenHolder } from "@/composables/useTokenHolders";
import type { PropType } from "vue";

import { formatPricePretty, formatValue } from "@/utils/formatters";

const props = defineProps({
  tokenInfo: {
    type: Object as PropType<Token>,
    required: true,
  },
  tokenOverview: {
    type: Object as PropType<TokenOverview>,
    required: true,
  },
  pagination: {
    type: Boolean,
    default: true,
  },
  useQueryPagination: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const { data, load, total, pending, pageSize } = useTokenHolders(props.tokenInfo.l2Address);
const activePage = ref(props.useQueryPagination ? parseInt(route.query.page as string) || 1 : 1);
const isLoading = computed(() => pending.value);
const { t } = useI18n();
const table = ref(null);
const subtraction = ref(6);

watch(
  [activePage, () => route.query.pageSize],
  ([page, pageSize]) => {
    const currentPageSize = pageSize ? parseInt(pageSize as string) : 10;
    load(page, undefined, currentPageSize);
  },
  { immediate: true }
);

const tokenHolders = computed<TokenHolder[] | undefined>(() => {
  return data.value?.map((holder) => {
    return {
      ...holder,
      percentage:
        props.tokenOverview.maxTotalSupply && holder.balance
          ? `${(parseFloat(holder.balance) / (props.tokenOverview.maxTotalSupply / 100)).toFixed(4)} %`
          : "",
    };
  });
});
</script>

<style scoped lang="scss">
.table-body-col {
  @apply relative flex flex-col items-end justify-end text-right md:table-cell md:w-1/3 md:text-left;
  &:before {
    @apply absolute left-4 top-3 whitespace-nowrap pr-5 text-left text-xs uppercase text-neutral-400 content-[attr(data-heading)] md:content-none;
  }
  .holder-address-container {
    @apply flex gap-x-1;
    .holder-address {
      @apply block cursor-pointer font-mono text-sm font-medium;
    }
  }
  .loading-row {
    .content-loader {
      @apply w-full;
    }
  }
  .holders-not-found {
    @apply my-0 table-cell items-start justify-start bg-white p-4 text-left text-gray-700;
  }
}
</style>
