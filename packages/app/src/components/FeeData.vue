<template>
  <div>
    <div class="fee-info-container">
      <TokenAmountPrice :token="token" :amount="feeData?.amountPaid" />
      <span class="payed-by-paymaster-label" v-if="feeData?.isPaidByPaymaster">
        {{ t("transactions.table.paidByPaymaster") }}
      </span>
      <button v-if="showDetails" class="toggle-button" @click="collapsed = !collapsed" type="button">
        {{ buttonTitle }}
      </button>
    </div>
    <div class="details-container" v-if="collapsed">
      <div class="details-data-container">
        <div class="details-title">{{ t("transactions.table.feeDetails.initial") }}</div>
        <TokenAmountPrice :token="token" :amount="initialFee!" />
      </div>
      <div class="details-data-container">
        <div class="details-title">{{ t("transactions.table.feeDetails.refunded") }}</div>
        <TokenAmountPrice :token="token" :amount="feeData?.amountRefunded" />
      </div>
      <div class="fee-transfers-container">
        <div class="details-title">{{ t("transactions.table.feeDetails.refunds") }}</div>
        <div v-for="(transfer, index) in feeData?.refunds" :key="index">
          <TransferTableCell :transfer="transfer" :paymaster-address="feeData?.paymasterAddress" />
        </div>
      </div>
      <div>
        <a
          class="refunded-link"
          href="https://docs.zksync.io/build/developer-reference/fee-model.html#refunds"
          target="_blank"
          >{{
            t(
              feeData?.isPaidByPaymaster
                ? "transactions.table.feeDetails.whyPaymasterRefunded"
                : "transactions.table.feeDetails.whyRefunded"
            )
          }}</a
        >
        <a
          v-if="feeData?.isPaidByPaymaster"
          class="paymaster-link"
          href="https://docs.zksync.io/build/developer-reference/account-abstraction.html#paymasters"
          target="_blank"
          >{{ t("transactions.table.feeDetails.whatIsPaymaster") }}</a
        >
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import TokenAmountPrice from "@/components/TokenAmountPrice.vue";
import TransferTableCell from "@/components/transactions/infoTable/TransferTableCell.vue";

import useContext from "@/composables/useContext";
import useToken from "@/composables/useToken";

import type { Token } from "@/composables/useToken";
import type { FeeData } from "@/composables/useTransaction";

import { numberToHexString } from "@/utils/formatters";

const { currentNetwork } = useContext();

const props = defineProps({
  showDetails: {
    type: Boolean,
    default: () => true,
  },
  feeData: {
    type: Object as PropType<FeeData | null>,
    default: () => ({}),
  },
});
const { t } = useI18n();

const { getTokenInfo, tokenInfo } = useToken();
const collapsed = ref(false);
const buttonTitle = computed(() =>
  collapsed.value ? t("transactions.table.feeDetails.closeDetails") : t("transactions.table.feeDetails.moreDetails")
);
getTokenInfo(currentNetwork.value.baseTokenAddress);

const initialFee = computed(() => {
  if (props.feeData) {
    return numberToHexString(BigInt(props.feeData.amountPaid) + BigInt(props.feeData.amountRefunded));
  }
  return null;
});
const token = computed<Token | null>(() => {
  return tokenInfo.value;
});
</script>
<style lang="scss" scoped>
.fee-info-container {
  @apply flex items-center gap-x-2;
}
.payed-by-paymaster-label {
  @apply text-gray-400;
}
.toggle-button {
  @apply text-primary-600 underline hover:text-[#7379E5];
}
.details-container {
  @apply mt-2 flex flex-col gap-y-1 rounded bg-neutral-100 p-2.5;
  .details-data-container {
    @apply flex gap-x-1;
  }
  .details-title {
    @apply font-bold;
  }
  .fee-transfers-container {
    @apply flex flex-col gap-y-1;
  }
  .refunded-link,
  .paymaster-link {
    @apply w-max;
  }
  .paymaster-link {
    @apply ml-2;
  }
}
</style>
