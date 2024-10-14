<template>
  <Table class="transaction-logs-table has-head" :loading="loading">
    <template #default>
      <template v-for="interop in displayedLogs" :key="interop.logIndex">
        <tr>
          <TableBodyColumn>
            {{ t("transactions.interop.destinationAddress") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <div class="address-value-container">
              <AddressLink
                :address="interop.destinationAddress"
                class="address-label"
                :data-testid="$testId.contractsAddress"
              />

              <CopyButton :value="interop.destinationAddress" />
            </div>
          </TableBodyColumn>
        </tr>
        <tr>
          <TableBodyColumn>
            {{ t("transactions.interop.destinationChain") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <div class="address-value-container">
              {{ formatHex(interop.destinationChain) }}
              <CopyButton :value="interop.destinationChain" />
            </div>
          </TableBodyColumn>
        </tr>
        <tr>
          <TableBodyColumn>
            {{ t("transactions.interop.sourceAddress") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <div class="address-value-container">
              <AddressLink
                :address="interop.sourceAddress"
                class="address-label"
                :data-testid="$testId.contractsAddress"
              />

              <CopyButton :value="interop.sourceAddress" />
            </div>
          </TableBodyColumn>
        </tr>
        <tr>
          <TableBodyColumn>
            {{ t("transactions.interop.mintValue") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <div class="address-value-container">
              {{ interop.mintValue }}
            </div>
          </TableBodyColumn>
        </tr>
        <tr>
          <TableBodyColumn>
            {{ t("transactions.interop.l2Value") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <div class="address-value-container">
              {{ interop.l2Value }}
            </div>
          </TableBodyColumn>
        </tr>
        <tr>
          <TableBodyColumn>
            {{ t("transactions.interop.calldata") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <div class="topic-container">
              <HashViewer :hash="'0x' + interop.data.slice(834)" v-slot="{ data }">
                <ByteData class="w-full" :value="data" />
              </HashViewer>
            </div>
          </TableBodyColumn>
        </tr>
        <tr class="last-row">
          <TableBodyColumn>
            {{ t("transactions.interop.data") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <div class="topic-container">
              <HashViewer :hash="interop.data" v-slot="{ data }">
                <ByteData class="w-full" :value="data" />
              </HashViewer>
            </div>
          </TableBodyColumn>
        </tr>
      </template>
    </template>
    <template v-if="!loading && logs?.length > pageSize" #footer>
      <div class="pagination">
        <Pagination
          :active-page="activePage"
          :total-items="logs?.length"
          :page-size="pageSize"
          @on-page-change="scrollPageToTop"
        />
      </div>
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
import { computed, type PropType } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import { log } from "console";

import AddressLink from "@/components/AddressLink.vue";
import Badge from "@/components/common/Badge.vue";
import CopyButton from "@/components/common/CopyButton.vue";
import Pagination from "@/components/common/Pagination.vue";
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import ByteData from "@/components/common/table/fields/ByteData.vue";
import EventTopics from "@/components/event/EventTopics.vue";
import HashViewer from "@/components/transactions/infoTable/HashViewer.vue";

import type { TransactionLogEntry } from "@/composables/useEventLog";
import type { Address, Hash } from "@/types";

import { getTypeFromEvent } from "@/utils/helpers";

const props = defineProps({
  logs: {
    type: Array as PropType<TransactionLogEntry[]>,
    default: () => [],
  },
  initiatorAddress: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: true,
  },
});

const { t } = useI18n();

const route = useRoute();
const activePage = computed(() => (route.query.page ? parseInt(route.query.page as string) : 1));
const pageSize = 25;

const isLogAnInterop = (log: TransactionLogEntry) => {
  return log.topics[0] == "0xaeb45e9fa7465a0054db321a0901056bc5e2ac40d10855aaaef37227d896635c";
};
const displayedLogs = computed(() => {
  const start = (activePage.value - 1) * pageSize;
  const end = start + pageSize;
  const logs = props.logs.slice(start, end);
  const interops = props.logs.filter((log) => isLogAnInterop(log)).map((log) => logToInterop(log));

  return interops.slice(start, end);
});

export type InteropEntry = {
  logIndex: Hash;

  destinationChain: Hash;
  destinationAddress: Address;
  sourceAddress: Address;
  data: Hash;
  mintValue: number;
  l2Value: number;
};

const logToInterop = (log: TransactionLogEntry): InteropEntry => {
  const MINT_VAL_SLOT = 4;
  const L2_VAL_SLOT = 5;
  return {
    logIndex: log.logIndex,
    destinationChain: log.topics[1],
    destinationAddress: "0x" + log.topics[2].slice(26),
    sourceAddress: "0x" + log.topics[3].slice(26),
    data: log.data,
    mintValue: parseInt(log.data.slice(2 + MINT_VAL_SLOT * 64, 2 + (MINT_VAL_SLOT + 1) * 64), 16),
    l2Value: parseInt(log.data.slice(2 + L2_VAL_SLOT * 64, 2 + (L2_VAL_SLOT + 1) * 64), 16),
  };
};

function setPopoverPlacement(logIndex: number) {
  return props.logs.length === 1 ? "right" : logIndex === props.logs.length - 1 ? "top" : "bottom";
}

function scrollPageToTop() {
  window.scrollTo(0, 0);
}

function formatHex(hex: string): string {
  // Remove '0x' and leading zeros
  const cleanedHex = hex.replace(/^0x0*/, "0x");

  // Convert hex to integer
  const intValue = parseInt(cleanedHex, 16);

  // If the value is small (e.g., less than 1000), show as integer
  if (intValue < 100000) {
    return intValue.toString() + " (" + cleanedHex + ")";
  }

  // Otherwise, return the hex with trailing zeros removed
  return cleanedHex;
}

// Function to remove trailing zeros from hex
function shortenHex(hex: string): string {
  return hex.replace(/0+$/, "");
}
</script>

<style lang="scss">
.transaction-logs-table {
  @apply text-base;

  tr {
    @apply border-0;

    &.last-row {
      @apply border-b;
    }

    .table-body-col {
      @apply py-3 align-top text-base;

      .address-value-container {
        @apply flex gap-x-4;

        .matches-topic {
          @apply text-base;
        }

        .address-label {
          @apply cursor-pointer text-base leading-6 text-primary-500 underline;
        }
      }

      .log-interface {
        @apply text-neutral-500;

        .log-interface-name {
          @apply text-neutral-600;
        }

        .log-parameter-type {
          @apply text-success-600;
        }

        .log-parameter-name {
          @apply text-error-600;
        }
      }

      .topic-container {
        @apply flex gap-4 text-base;

        &:not(:last-child) {
          @apply mb-3;
        }
      }
    }
  }

  .pagination {
    @apply flex justify-center p-3;
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

  .event-topics {
    .only-desktop {
      @apply flex;
    }

    .only-mobile {
      @apply hidden;
    }

    .topic-value {
      @apply whitespace-nowrap;
    }
  }
}
</style>
