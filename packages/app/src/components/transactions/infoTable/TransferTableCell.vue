<template>
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
    <div v-if="!transfer.nftItem" class="transfer-amount-container">
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
    <div v-else class="transfer-nft-container">
      <span>{{ t("transactions.table.for") }}</span>
      <NftItemTableCell
        class="nft-icon"
        v-if="transfer.nftItem"
        :url="transfer.nftItem.imageUrl"
        :symbol="transfer.tokenInfo?.symbol"
        :name="transfer.nftItem.name"
        :tokenAddress="transfer.tokenInfo?.l2Address"
        :token-id="transfer.nftItem.tokenId"
        :iconSize="'md'"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";
import { useI18n } from "vue-i18n";

import TokenIconLabel from "@/components/TokenIconLabel.vue";
import NftItemTableCell from "@/components/nft/NftItemTableCell.vue";
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
});

const transferAmount = computed(() =>
  props.transfer.tokenInfo ? formatBigNumberish(props.transfer.amount || 0, props.transfer.tokenInfo?.decimals) : ""
);
</script>

<style lang="scss" scoped>
.transfer-container {
  @apply mb-1 flex gap-x-2 text-sm last:mb-0;

  .transfer-amount-container {
    @apply inline-flex items-center gap-x-1;
    .token-icon {
      @apply inline-flex;
    }
  }

  .transfer-nft-container {
    @apply inline-flex items-center gap-x-1;
    .nft-icon {
      @apply inline-flex;
    }
  }
}
</style>
