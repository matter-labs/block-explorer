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
                <p v-if="displayedTxReceiverName">({{ displayedTxReceiverName }})</p>
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
          <div v-for="(item, index) in tokenTransfers" :key="index">
            <TransferTableCell :transfer="item.transfer" :memo="item.memo" />
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

      <tr v-if="interopBundle" class="transaction-table-row">
        <TableBodyColumn class="transaction-table-label">
          <span class="transaction-info-field-label">{{ t("transactions.table.interopBundle") }}</span>
          <InfoTooltip class="transaction-info-field-tooltip">
            {{ t("transactions.table.interopBundleTooltip") }}
          </InfoTooltip>
        </TableBodyColumn>
        <TableBodyColumn class="transaction-table-value">
          <div class="interop-bundle">
            <div class="interop-bundle-field interop-bundle-chain-ids">
              <span class="interop-bundle-label">{{ t("transactions.table.interopBundleSourceChainId") }}:</span>
              <span class="interop-bundle-value">{{ interopBundle.sourceChainId }}</span>
              <span class="interop-bundle-label">{{ t("transactions.table.interopBundleDestinationChainId") }}:</span>
              <span class="interop-bundle-value">{{ interopBundle.destinationChainId }}</span>
            </div>
            <div class="interop-bundle-field">
              <span class="interop-bundle-label">{{ t("transactions.table.interopBundleCalls") }}:</span>
              <div v-for="(call, index) in interopBundle.calls" :key="index" class="interop-bundle-call-starter">
                <div class="interop-bundle-call-starter-index">[{{ index }}]</div>
                <div class="interop-bundle-row">
                  <span class="interop-bundle-label">{{ t("transactions.table.interopBundleCallFrom") }}:</span>
                  <AddressLink :address="call.from" />
                </div>
                <div class="interop-bundle-row">
                  <span class="interop-bundle-label">{{ t("transactions.table.interopBundleCallTo") }}:</span>
                  <AddressLink :address="call.to" />
                </div>
                <div class="interop-bundle-row">
                  <span class="interop-bundle-label">{{ t("transactions.table.interopBundleCallValue") }}:</span>
                  <span class="interop-bundle-value">{{ call.value }}</span>
                </div>
                <div class="interop-bundle-row">
                  <span class="interop-bundle-label">{{ t("transactions.table.interopBundleCallData") }}:</span>
                  <InteropCallData :to="call.to" :call-data="call.data" :call-value="call.value" />
                </div>
              </div>
            </div>
            <div class="interop-bundle-row">
              <span class="interop-bundle-label">{{ t("transactions.table.interopBundleExecutionAddress") }}:</span>
              <AddressLink :address="interopBundle.bundleAttributes.executionAddress" />
            </div>
            <div class="interop-bundle-row">
              <span class="interop-bundle-label">{{ t("transactions.table.interopBundleUnbundlerAddress") }}:</span>
              <AddressLink :address="interopBundle.bundleAttributes.unbundlerAddress" />
            </div>
          </div>
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
import InteropCallData from "@/components/transactions/infoTable/InteropCallData.vue";
import TransactionData from "@/components/transactions/infoTable/TransactionData.vue";
import TransferTableCell from "@/components/transactions/infoTable/TransferTableCell.vue";

import type { TransactionItem } from "@/composables/useTransaction";

import {
  decodeInteropBundleSentEvent,
  decodeTransferWithMemoEvent,
  getContractDisplayName,
  INTEROP_BUNDLE_SENT_TOPIC,
  isContractDeployerAddress,
  TRANSFER_WITH_MEMO_TOPIC,
} from "@/utils/helpers";

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

const displayedTxReceiverName = computed(() => {
  return getContractDisplayName(displayedTxReceiver.value);
});

const interopBundle = computed(() => {
  const log = props.transaction?.logs?.find((entry) => entry.topics[0]?.toLowerCase() === INTEROP_BUNDLE_SENT_TOPIC);
  if (!log) return null;
  return decodeInteropBundleSentEvent(log) ?? null;
});

const tokenTransfers = computed(() => {
  // exclude transfers with no amount, such as NFT until we fully support them
  const transfers = props.transaction?.transfers.filter((transfer) => transfer.amount) || [];

  // Decode TransferWithMemo logs once, in emission order, so that identical
  // transfers (same from/to/value/token) pair with the correct memo by position
  // rather than the first value-match. Each log is consumed at most once.
  const memoLogs = (props.transaction?.logs || [])
    .filter((log) => log.topics[0]?.toLowerCase() === TRANSFER_WITH_MEMO_TOPIC)
    .slice()
    .sort((a, b) => Number(a.logIndex) - Number(b.logIndex))
    .map((log) => ({ log, decoded: decodeTransferWithMemoEvent(log), consumed: false }))
    .filter((entry) => entry.decoded);

  return transfers.map((transfer) => {
    const match = memoLogs.find(
      (entry) =>
        !entry.consumed &&
        entry.log.address.toLowerCase() === transfer.tokenInfo?.l2Address?.toLowerCase() &&
        entry.decoded!.from.toLowerCase() === transfer.from.toLowerCase() &&
        entry.decoded!.to.toLowerCase() === transfer.to.toLowerCase() &&
        entry.decoded!.value === transfer.amount
    );
    if (match) {
      match.consumed = true;
    }
    return { transfer, memo: match?.decoded?.memo ?? null };
  });
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
  .interop-bundle {
    @apply flex flex-col gap-3 text-sm;

    .interop-bundle-field {
      @apply flex flex-col gap-1;
    }
    .interop-bundle-chain-ids {
      @apply flex-row flex-wrap items-center gap-x-4 gap-y-1;
    }
    .interop-bundle-label {
      @apply text-gray-400;
    }
    .interop-bundle-value {
      @apply text-gray-800;
    }
    .interop-bundle-row {
      @apply flex flex-wrap items-start gap-2;
    }
    .interop-bundle-call-starter {
      @apply ml-2 flex flex-col gap-1 rounded-md border bg-neutral-100 px-3 py-2;

      .interop-bundle-call-starter-index {
        @apply font-mono text-neutral-500;
      }
    }
    .interop-bundle-bytes {
      @apply break-all font-mono text-neutral-700;
    }
    .interop-bundle-attributes {
      @apply ml-4 list-disc text-neutral-700;
    }
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
