<template>
  <div class="transaction-input-data" :class="{ 'no-error': !error && !emptyCalldata }">
    <button v-if="!error && !emptyCalldata" class="toggle-decode-button" @click="showDecoded = !showDecoded">
      {{ displayedButtonText }}
    </button>
    <ByteData v-if="!showDecoded" class="transaction-byte-data" :value="data?.calldata" />
    <div v-else-if="loading" class="decoding-loading">
      <Spinner size="sm" outline />
      <span class="decoding-loading-label">{{ t("transactionData.decodingInProgress") }}</span>
    </div>
    <div v-else-if="data?.method">
      <div class="method-interface">Function: {{ methodInterface }}</div>
    </div>
    <div v-if="error" class="decoding-data-error">
      {{
        t("transactionData.errors.unableToDecode", {
          error: te(`transactionData.errors.${error}`) ? t(`transactionData.errors.${error}`) : error,
        })
      }}
    </div>
    <template v-if="showDecoded && hasInputs">
      <div>
        <Dropdown
          class="show-as-dropdown"
          v-model="showDataAs"
          :options="showDataAsOptions"
          :formatter="showDataAsDropdownFormatter"
        />
      </div>
      <div class="transaction-data-inputs">
        <Table
          v-if="showDataAs === 'decoded'"
          class="method-parameters-table"
          :loading="false"
          :items="data!.method!.inputs"
        >
          <template #table-head>
            <TableHeadColumn>#</TableHeadColumn>
            <TableHeadColumn>{{ t("transactionData.parametersTable.name") }}</TableHeadColumn>
            <TableHeadColumn>{{ t("transactionData.parametersTable.type") }}</TableHeadColumn>
            <TableHeadColumn>{{ t("transactionData.parametersTable.data") }}</TableHeadColumn>
          </template>
          <template #table-row="{ item, index }: { item: any, index: number }">
            <TableBodyColumn data-heading="#">{{ index }}</TableBodyColumn>
            <TableBodyColumn :data-heading="t('transactionData.parametersTable.name')">{{ item.name }}</TableBodyColumn>
            <TableBodyColumn :data-heading="t('transactionData.parametersTable.type')">{{ item.type }}</TableBodyColumn>
            <TableBodyColumn :data-heading="t('transactionData.parametersTable.data')">
              <AddressLink v-if="item.type === 'address'" :address="item.value" class="argument-value">
                {{ checksumAddress(item.value) }}
              </AddressLink>
              <span v-else class="argument-value">{{ item.value }}</span>
            </TableBodyColumn>
          </template>
        </Table>
        <div v-else class="encoded-data-container">
          <div>MethodID: {{ data!.sighash }}</div>
          <div v-for="(item, index) in data!.method!.inputs" :key="index">[{{ index }}]: {{ item.encodedValue }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import AddressLink from "@/components/AddressLink.vue";
import Dropdown from "@/components/common/Dropdown.vue";
import Spinner from "@/components/common/Spinner.vue";
import Table from "@/components/common/table/Table.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";
import TableHeadColumn from "@/components/common/table/TableHeadColumn.vue";
import ByteData from "@/components/common/table/fields/ByteData.vue";

import type { TransactionData } from "@/composables/useTransactionData";

import { checksumAddress } from "@/utils/formatters";

const props = defineProps({
  data: {
    type: Object as PropType<TransactionData>,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
  },
});

const { t, te } = useI18n();

const showDecoded = ref(props.data?.method ? true : false);
const emptyCalldata = ref(props.data?.calldata === "0x");

const showDataAsOptions = ["decoded", "original"];
const showDataAs = ref(showDataAsOptions[0]);
const showDataAsDropdownFormatter = (value: unknown) => t(`transactionData.viewOptions.${value}`);

const displayedButtonText = computed(() =>
  showDecoded.value ? t("transactionData.showOriginalInput") : t("transactionData.showDecodedInput")
);
const methodInterface = computed(() => {
  if (!props.data?.method) {
    return "";
  }

  const inputs = props.data.method.inputs.map((input) => `${input.type} ${input.name}`).join(", ");

  return `${props.data.method.name}(${inputs})`;
});
const hasInputs = computed(() => !!props.data?.method?.inputs.length);
</script>

<style lang="scss">
.transaction-input-data {
  @apply grid w-full gap-4 text-sm;

  .toggle-decode-button {
    @apply block h-10 w-fit rounded-md bg-primary-600 bg-opacity-[15%] px-4 py-2 text-primary-600 transition-colors hover:bg-opacity-10 sm:w-full;
  }
  .transaction-byte-data {
    @apply overflow-auto;
  }
  .show-as-dropdown .toggle-button {
    @apply h-10 border-gray-200 bg-neutral-100 py-2;
  }
  .decoding-loading {
    @apply flex h-10 items-center;

    .decoding-loading-label {
      @apply ml-2;
    }
  }
  .decoding-data-error {
    @apply self-center whitespace-pre-line leading-tight;
  }
  .encoded-data-container,
  .method-interface {
    @apply flex h-max flex-col justify-center rounded-md border bg-neutral-100 px-4 py-[0.56rem] font-mono text-neutral-700;
  }
  .method-interface {
    @apply whitespace-pre-line text-black;
  }
  .encoded-data-container {
    @apply min-h-[40px] overflow-auto whitespace-nowrap text-xs text-neutral-700;
  }
  .transaction-data-inputs {
    @apply overflow-auto;

    .method-parameters-table {
      @apply overflow-auto border shadow-none;

      .table-body {
        table {
          @apply block md:table;

          tbody {
            @apply block md:table-row-group;

            tr {
              @apply block md:table-row;
            }
          }
        }
        .table-head-col,
        .table-body-col {
          @apply first:pl-4 last:pr-4;
        }
        .table-head-col {
          @apply py-2;
        }
        .table-body-col {
          @apply relative m-0 flex flex-col items-end whitespace-normal py-1.5 text-right font-mono text-black first:font-normal md:table-cell md:text-left;
          &:before {
            @apply absolute left-4 top-2 whitespace-nowrap pr-5 text-left text-xs uppercase text-neutral-400 content-[attr(data-heading)] md:content-none;
          }

          .argument-value {
            @apply max-w-[75%] break-words;
          }
        }
      }
    }
  }
}
.no-error {
  @apply sm:grid-cols-[max-content_1fr];
}
</style>
