<template>
  <div class="transfer-cell">
    <div class="transfer-container">
      <TransferInfo
        :label="t('transactions.table.from')"
        :network="transfer.fromNetwork"
        :address="transfer.from"
        :is-paymaster="transfer.from === paymasterAddress"
      />
      <TransferInfo
        :label="t('transactions.table.transferTo')"
        :network="transfer.toNetwork"
        :address="transfer.to"
        :is-paymaster="transfer.to === paymasterAddress"
      />
      <div class="transfer-amount-container">
        <span>{{ t("transactions.table.for") }}</span>
        <span class="transfer-amount-value">{{ transferAmount }}</span>
        <TokenIconLabel
          v-if="transfer.tokenInfo"
          class="token-icon"
          :address="transfer.tokenInfo.l2Address"
          :symbol="transfer.tokenInfo.symbol"
          :icon-url="transfer.tokenInfo.iconURL"
          icon-size="md"
          show-link-symbol
        />
      </div>
      <button
        v-if="memo"
        class="transfer-memo-badge"
        :aria-expanded="showMemo"
        :title="t('transactions.table.iso20022.toggle')"
        @click="showMemo = !showMemo"
      >
        <span class="transfer-memo-badge-label">{{ t("transactions.table.iso20022.badge") }}</span>
        <ChevronDownIcon class="transfer-memo-chevron" :class="{ 'is-open': showMemo }" />
      </button>
    </div>
    <Iso20022Memo v-if="memo && showMemo" :memo="memo" />
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import { ChevronDownIcon } from "@heroicons/vue/solid";

import TokenIconLabel from "@/components/TokenIconLabel.vue";
import Iso20022Memo from "@/components/transactions/infoTable/Iso20022Memo.vue";
import TransferInfo from "@/components/transactions/infoTable/TransferInfo.vue";

import type { TokenTransfer } from "@/composables/useTransaction";
import type { Hash } from "@/types";

import { formatBigNumberish } from "@/utils/formatters";

const { t } = useI18n();

const props = defineProps({
  transfer: {
    type: Object as PropType<TokenTransfer>,
    required: true,
  },
  paymasterAddress: {
    type: String as PropType<Hash>,
  },
  // Decoded ISO 20022 pain.001 memo (raw XML) attached to this transfer, if any.
  memo: {
    type: String as PropType<string | null>,
    default: null,
  },
});

const showMemo = ref(false);

const transferAmount = computed(() =>
  props.transfer.tokenInfo ? formatBigNumberish(props.transfer.amount || 0, props.transfer.tokenInfo?.decimals) : ""
);
</script>

<style lang="scss" scoped>
.transfer-cell {
  @apply mb-1 last:mb-0;

  .transfer-container {
    @apply flex flex-wrap items-center gap-x-2 gap-y-1 text-sm;

    .transfer-memo-badge {
      @apply inline-flex items-center gap-x-1 rounded-full bg-primary-600 bg-opacity-[15%] px-2.5 py-0.5 text-xs font-medium text-primary-600 transition-colors hover:bg-opacity-25;

      .transfer-memo-chevron {
        @apply h-3.5 w-3.5 transition-transform;

        &.is-open {
          @apply rotate-180;
        }
      }
    }

    .transfer-amount-container {
      @apply inline-flex items-center gap-x-1;
      .token-icon {
        @apply inline-flex;
      }
    }
  }
}
</style>
