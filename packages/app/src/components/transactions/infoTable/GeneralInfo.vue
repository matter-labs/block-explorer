<template>
  <Table class="transaction-info-table has-head" :loading="loading">
    <template #default>
      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.transactionHash") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.transactionHashTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">
          <CopyContent :value="transaction?.hash" />
        </TableBodyColumn>
      </tr>
      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label transaction-status-label">
            {{ t("transactions.table.status") }}
          </span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.statusTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value transaction-status-value">
          <TransactionStatus :status="transaction!.status" />
        </TableBodyColumn>
      </tr>
      <tr v-if="transaction?.error" class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label transaction-error-label">
            {{ t("transactions.table.error") }}
          </span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.errorTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value transaction-error-value">
          {{ transaction.error }}
        </TableBodyColumn>
      </tr>
      <tr v-if="transaction?.revertReason" class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label transaction-reason-label">
            {{ t("transactions.table.reason") }}
          </span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.reasonTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value transaction-error-value">
          {{ transaction.revertReason }}
        </TableBodyColumn>
      </tr>
      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.block") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.blockTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">
          <span v-if="transaction?.blockNumber || transaction?.blockNumber === 0">
            <span v-if="transaction.status === 'indexing'">#{{ transaction.blockNumber }}</span>
            <router-link
              v-else
              :data-testid="$testId.blocksNumber"
              :to="{
                name: 'block',
                params: { id: transaction.blockNumber },
              }"
            >
              #{{ transaction.blockNumber }}
            </router-link>
          </span>
          <span v-else>{{ t("transactions.table.notYetSentOnTheChain") }}</span>
        </TableBodyColumn>
      </tr>
      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.from") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.fromTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">
          <div class="value-with-copy-button">
            <AddressLink :address="transaction?.from" :data-testid="$testId.fromAddress" />
            <CopyButton :value="transaction?.from" />
          </div>
        </TableBodyColumn>
      </tr>
      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.to") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.toTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">
          <div class="value-with-copy-button">
            <div class="address-badge-container">
              <div class="flex items-center justify-center gap-2">
                <AddressLink v-if="!!displayedTxReceiver" :address="displayedTxReceiver" />
                <p v-if="isContractDeploymentTx">{{ t("contract.created") }}</p>
              </div>
              <Badge
                v-if="transaction?.isEvmLike && displayedTxReceiver"
                color="primary"
                class="verified-badge"
                :tooltip="t('contract.evmTooltip')"
              >
                {{ t("contract.evm") }}
              </Badge>
            </div>
            <CopyButton v-if="displayedTxReceiver" :value="displayedTxReceiver" />
          </div>
        </TableBodyColumn>
      </tr>
      <tr v-if="tokenTransfers.length">
        <TableBodyColumn class="transaction-table-label transaction-token-transferred">
          <span class="transaction-info-field-label">{{ t("transactions.table.tokensTransferred") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.tokensTransferredTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">
          <div v-for="transfer in tokenTransfers" :key="transfer.to + transfer.from">
            <TransferTableCell :transfer="transfer" />
          </div>
        </TableBodyColumn>
      </tr>
      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label input-data-label">{{ t("transactions.table.inputData") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.inputDataTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">
          <TransactionData :data="transaction?.data" :error="decodingDataError" />
        </TableBodyColumn>
      </tr>

      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.value") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.valueTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">
          <EthAmountPrice :amount="transaction?.value"></EthAmountPrice>
        </TableBodyColumn>
      </tr>

      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.fee") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.feeTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">
          <FeeData :fee-data="transaction?.feeData" :show-details="showFeeDetails" />
        </TableBodyColumn>
      </tr>
      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.gasLimitAndUsed") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">{{
            t("transactions.table.gasLimitAndUsedTooltip")
          }}</InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value"
          >{{ transaction?.gasLimit }} | {{ transaction?.gasUsed }} ({{ gasUsedPercent }}%)</TableBodyColumn
        >
      </tr>
      <tr class="transaction-table-row" v-if="transaction?.gasPerPubdata">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.gasPerPubdata") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">{{
            t("transactions.table.gasPerPubdataTooltip")
          }}</InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">{{ transaction.gasPerPubdata }}</TableBodyColumn>
      </tr>
      <tr class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.nonce") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.nonceTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">{{ transaction?.nonce }}</TableBodyColumn>
      </tr>
      <tr class="transaction-table-row">
        <table-body-column class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.timestamp") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.timestampTooltip") }}
          </InfoTooltip>
        </table-body-column>
        <table-body-column class="transaction-table-value">
          <TimeField :value="transaction?.receivedAt" />
        </table-body-column>
      </tr>
    </template>
    <template #loading>
      <tr class="loading-row" v-for="row in 11" :key="row">
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
import { computed, type PropType } from "vue";
import { useI18n } from "vue-i18n";

import AddressLink from "@/components/AddressLink.vue";
import FeeData from "@/components/FeeData.vue";
import Badge from "@/components/common/Badge.vue";
import CopyButton from "@/components/common/CopyButton.vue";
import InfoTooltip from "@/components/common/InfoTooltip.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import CopyContent from "@/components/common/table/fields/CopyContent.vue";
import TimeField from "@/components/common/table/fields/TimeField.vue";
import EthAmountPrice from "@/components/transactions/EthAmountPrice.vue";
import TransactionStatus from "@/components/transactions/Status.vue";
import TransactionData from "@/components/transactions/infoTable/TransactionData.vue";
import TransferTableCell from "@/components/transactions/infoTable/TransferTableCell.vue";

import type { TransactionItem } from "@/composables/useTransaction";

import { isContractDeployerAddress } from "@/utils/helpers";

const { t } = useI18n();

const props = defineProps({
  transaction: {
    type: Object as PropType<TransactionItem | null>,
    default: null,
  },
  loading: {
    type: Boolean,
    default: true,
  },
  decodingDataError: {
    type: String,
  },
});

const showFeeDetails = computed(() => {
  if (props.transaction) {
    const tx = props.transaction;
    // Transaction is being indexed or doesn't have fee details to show
    return tx.status !== "indexing" && (tx.feeData.refunds.length > 0 || tx.feeData.isPaidByPaymaster);
  }
  return false;
});

const isContractDeploymentTx = computed(() => {
  return isContractDeployerAddress(props.transaction?.to) && !!props.transaction?.contractAddress;
});

const displayedTxReceiver = computed(() => {
  return isContractDeploymentTx.value ? props.transaction?.contractAddress : props.transaction?.to;
});

const tokenTransfers = computed(() => {
  // exclude transfers with no amount, such as NFT until we fully support them
  return props.transaction?.transfers.filter((transfer) => transfer.amount) || [];
});

const gasUsedPercent = computed(() => {
  if (props.transaction) {
    const gasLimit = parseInt(props.transaction.gasLimit, 10);
    const gasUsed = parseInt(props.transaction.gasUsed, 10);
    return parseFloat(((gasUsed / gasLimit) * 100).toFixed(2));
  }
  return null;
});
</script>

<style lang="scss">
.transaction-info-table {
  .table-body-col {
    @apply py-4;
  }
  .loading-row {
    .table-body-col {
      @apply first:w-[9rem];

      .content-loader {
        @apply w-full;

        &:nth-child(2) {
          @apply max-w-md;
        }
      }
    }
  }
  .transaction-info-field-label {
    @apply text-gray-400;
  }
  .transaction-info-field-value {
    @apply text-gray-800;
  }
  .transaction-table-label {
    @apply m-0 inline-flex w-[7rem] items-center whitespace-normal sm:w-[11.5rem];

    .transaction-info-field-tooltip {
      @apply ml-1;
    }
    .input-data-label,
    .transaction-status-label {
      @apply inline-block;
    }
  }
  .transaction-table-value {
    @apply m-0 w-full;
  }
  .transaction-token-transferred {
    @apply align-top;
  }
  .copy-button-container {
    @apply inline;
  }
  .value-with-copy-button {
    display: flex;
    justify-content: space-between;
  }
  .address-badge-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }
  .transaction-status-value {
    @apply py-2;
  }
  .transaction-error-value {
    @apply whitespace-normal break-all text-error-600;
  }
}
</style>
