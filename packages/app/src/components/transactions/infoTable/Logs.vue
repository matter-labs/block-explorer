<template>
  <Table class="transaction-logs-table has-head" :loading="loading">
    <template #default>
      <template v-for="(log, logIndex) in displayedLogs" :key="log.logIndex">
        <tr>
          <TableBodyColumn>
            {{ t("transactions.logs.address") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <div class="address-value-container">
              <AddressLink :address="log.address" class="address-label" :data-testid="$testId.contractsAddress" />
              <CopyButton :value="log.address" />
              <Badge v-if="log.address === initiatorAddress">
                <div class="matches-topic">
                  {{ t("transactions.logs.matchesTopic") }}
                </div>
              </Badge>
            </div>
          </TableBodyColumn>
        </tr>
        <tr v-if="log.event">
          <TableBodyColumn>
            {{ t("transactions.logs.name") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <span class="log-interface">
              <span class="log-interface-name">{{ log.event.name }}</span>
              (<span v-for="(input, inputIndex) in log.event.inputs" :key="inputIndex">
                <span
                  >{{
                    inputIndex === log.event.inputs.length - 1 ? "data" : `index_topic_${inputIndex + 1}`
                  }}&nbsp;</span
                >
                <span class="log-parameter-type">{{ input.type }}&nbsp;</span>
                <span class="log-parameter-name">{{ input.name }}</span>
                <span v-if="inputIndex < log.event.inputs.length - 1">,&nbsp;</span></span
              >)
            </span>
          </TableBodyColumn>
        </tr>
        <tr>
          <TableBodyColumn>
            {{ t("transactions.logs.topics") }}
          </TableBodyColumn>
          <TableBodyColumn class="event-topics">
            <EventTopics
              :topics="log.topics"
              :event="log.event"
              :popover-placement="setPopoverPlacement(logIndex)"
              show-copy-button
            />
          </TableBodyColumn>
        </tr>
        <tr class="last-row">
          <TableBodyColumn>
            {{ t("transactions.logs.data") }}
          </TableBodyColumn>
          <TableBodyColumn>
            <div class="topic-container">
              <HashViewer
                :hash="log.data"
                :default-type="getTypeFromEvent(log.event!, log.event ? log.event.inputs.length : 0)"
                :popover-placement="setPopoverPlacement(logIndex)"
                v-slot="{ data }"
              >
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
const displayedLogs = computed(() => {
  const start = (activePage.value - 1) * pageSize;
  const end = start + pageSize;
  return props.logs.slice(start, end);
});

function setPopoverPlacement(logIndex: number) {
  return props.logs.length === 1 ? "right" : logIndex === props.logs.length - 1 ? "top" : "bottom";
}

function scrollPageToTop() {
  window.scrollTo(0, 0);
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
