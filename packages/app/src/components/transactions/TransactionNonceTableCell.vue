<template>
  <div class="nonce-table-cell-container">
    <span class="transactions-data-transaction-nonce">{{ nonce }}</span>

    <Tooltip v-if="direction === 'in' && nonce !== null && nonceInfo">
      <InformationCircleIcon class="nonce-info-icon" />

      <template #content>
        <span class="text-xs">{{ t("transactions.table.sendersNonce") }}</span>
      </template>
    </Tooltip>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import { InformationCircleIcon } from "@heroicons/vue/outline";

import Tooltip from "@/components/common/Tooltip.vue";

import type { Direction } from "@/components/transactions/TransactionDirectionTableCell.vue";
import type { PropType } from "vue";

const { t } = useI18n();

defineProps({
  nonce: {
    type: Number as PropType<number | null>,
    default: null,
  },
  nonceInfo: {
    type: Boolean,
    default: false,
  },
  direction: {
    type: String as PropType<Direction>,
    default: "out",
  },
});
</script>

<style scoped lang="scss">
.nonce-table-cell-container {
  @apply flex items-center gap-x-1;
  .transactions-data-transaction-nonce {
    @apply text-sm;
  }
  .nonce-info-icon {
    @apply h-4 w-4 cursor-pointer text-neutral-400;
  }
}
</style>
