<template>
  <div class="transaction-input-data">
    <ByteData v-if="!showDecoded" class="transaction-byte-data" :value="data?.calldata" />
    <div v-else-if="loading" class="decoding-loading">
      <Spinner size="sm" outline />
      <span class="decoding-loading-label">{{ t("transactionData.decodingInProgress") }}</span>
    </div>
    <div v-else-if="data?.method || error" class="decoded-data-box">
      <div v-if="data?.method" class="data-line mb-6">Function: {{ methodInterfaceWithStars }}</div>

      <div v-if="data?.sighash" class="data-line">MethodID: {{ data.sighash }}</div>

      <div v-if="hasInputs && data?.calldata" class="parameters-section">
        <div v-for="(item, index) in getParameterHexValues()" :key="index" class="data-line">
          [{{ index }}]: {{ item }}
        </div>
      </div>

      <div v-if="error && error !== 'signature_decode_limited' && !data?.method" class="decoding-data-error">
        {{
          t("transactionData.errors.unableToDecode", {
            error: te(`transactionData.errors.${error}`) ? t(`transactionData.errors.${error}`) : error,
          })
        }}
      </div>
    </div>

    <div v-if="(!error || error === 'signature_decode_limited') && !emptyCalldata" class="button-group">
      <button class="toggle-decode-button" @click="showDecoded = !showDecoded">
        {{ displayedButtonText }}
      </button>
      <button
        v-if="showDecoded && hasInputs && showDataAs !== 'decoded'"
        class="toggle-view-button"
        @click="toggleDataView"
      >
        {{ showDataAs === "decoded" ? "View as Binary" : "View Decoded" }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import AddressLink from "@/components/AddressLink.vue";
import Spinner from "@/components/common/Spinner.vue";
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

const methodInterfaceWithStars = computed(() => {
  if (!props.data?.method) {
    return "";
  }

  // Replace parameter names with *** for Etherscan-style display
  const inputs = props.data.method.inputs.map((input) => `${input.type} ***`).join(", ");

  return `${props.data.method.name}(${inputs})`;
});

const hasInputs = computed(() => !!props.data?.method?.inputs.length);

const getParameterHexValues = () => {
  if (!props.data?.calldata || !props.data?.method?.inputs) {
    return [];
  }

  // Remove 0x and method signature (first 4 bytes = 8 hex chars)
  const paramData = props.data.calldata.slice(10);

  // Each parameter is 32 bytes (64 hex chars)
  const params: string[] = [];
  for (let i = 0; i < props.data.method.inputs.length; i++) {
    const start = i * 64;
    const param = paramData.slice(start, start + 64);
    params.push(param);
  }

  return params;
};

const toggleDataView = () => {
  showDataAs.value = showDataAs.value === "decoded" ? "original" : "decoded";
};
</script>

<style lang="scss">
.transaction-input-data {
  @apply flex flex-col gap-3 w-full text-sm;

  .transaction-byte-data {
    @apply overflow-auto;
  }

  .decoding-loading {
    @apply flex h-10 items-center;

    .decoding-loading-label {
      @apply ml-2;
    }
  }

  .decoding-data-error {
    @apply self-center whitespace-pre-line leading-tight text-red-600;
  }

  .decoded-data-box {
    @apply rounded-md border bg-neutral-100 px-4 py-3 font-mono text-sm leading-relaxed;

    .data-line {
      @apply text-neutral-700;
      font-weight: 400; /* Normal weight for all text */
    }

    .parameters-section {
      /* CHANGE 2: Changed mt-2 to mt-0 and space-y-1 to space-y-0 */
      /* This removes the top gap and tightens the lines */
      @apply mt-0 space-y-0;
    }
  }

  .button-group {
    @apply flex gap-2;

    .toggle-decode-button,
    .toggle-view-button {
      @apply h-9 w-auto px-4 py-2 rounded-md text-sm font-medium transition-colors;
    }

    .toggle-decode-button {
      @apply bg-primary-600 bg-opacity-[15%] text-primary-600 hover:bg-opacity-10;
    }

    .toggle-view-button {
      @apply bg-neutral-200 text-neutral-700 hover:bg-neutral-300;
    }
  }
}
</style>
