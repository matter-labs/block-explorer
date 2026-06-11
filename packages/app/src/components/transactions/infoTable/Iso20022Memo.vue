<template>
  <div class="iso20022-memo">
    <div class="iso20022-memo-toolbar">
      <button class="iso20022-memo-toggle" @click="showRaw = !showRaw">
        {{ showRaw ? t("transactions.table.iso20022.viewDetails") : t("transactions.table.iso20022.viewRawXml") }}
      </button>
    </div>

    <!-- Raw XML view -->
    <pre v-if="showRaw" class="iso20022-memo-raw">{{ prettyXml }}</pre>

    <!-- Parsed details view -->
    <div v-else-if="fields.length" class="iso20022-memo-fields">
      <div v-for="field in fields" :key="field.label" class="iso20022-memo-field">
        <span class="iso20022-memo-label">{{ field.label }}</span>
        <AddressLink v-if="field.isAddress" :address="field.value" class="iso20022-memo-value" />
        <TimeField v-else-if="field.isTime" :value="field.value" class="iso20022-memo-value" />
        <span v-else class="iso20022-memo-value">{{ field.value }}</span>
      </div>
    </div>

    <!-- Fallback: memo could not be parsed as pain.001 -->
    <div v-else class="iso20022-memo-fallback">
      <span class="iso20022-memo-fallback-note">{{ t("transactions.table.iso20022.parseFailed") }}</span>
      <pre class="iso20022-memo-raw">{{ memo }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import AddressLink from "@/components/AddressLink.vue";
import TimeField from "@/components/common/table/fields/TimeField.vue";

import { parseIso20022Pain001, prettyPrintXml } from "@/utils/iso20022";

const props = defineProps<{
  memo: string;
}>();

const { t } = useI18n();

const showRaw = ref(false);

const payment = computed(() => parseIso20022Pain001(props.memo));
const prettyXml = computed(() => prettyPrintXml(props.memo));

type Field = { label: string; value: string; isAddress?: boolean; isTime?: boolean };

// TimeField (and its date-fns helpers) assume an ISO string ending in "Z".
// pain.001 CreDtTm usually omits the zone, so treat a zone-less value as UTC by
// appending "Z"; leave values that already carry a zone designator untouched.
function toZonedIso(value: string): string {
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
}

const fields = computed<Field[]>(() => {
  const p = payment.value;
  if (!p) return [];

  const amount =
    p.instructedAmount && p.currency ? `${p.instructedAmount} ${p.currency}` : p.instructedAmount || undefined;

  const rows: (Field | null)[] = [
    p.msgId ? { label: t("transactions.table.iso20022.msgId"), value: p.msgId } : null,
    p.creationDateTime
      ? { label: t("transactions.table.iso20022.created"), value: toZonedIso(p.creationDateTime), isTime: true }
      : null,
    p.instructionId ? { label: t("transactions.table.iso20022.instructionId"), value: p.instructionId } : null,
    p.endToEndId ? { label: t("transactions.table.iso20022.endToEndId"), value: p.endToEndId } : null,
    amount ? { label: t("transactions.table.iso20022.amount"), value: amount } : null,
    p.purposeCode ? { label: t("transactions.table.iso20022.purpose"), value: p.purposeCode } : null,
    p.debtorName ? { label: t("transactions.table.iso20022.debtorName"), value: p.debtorName } : null,
    p.debtorAccount
      ? { label: t("transactions.table.iso20022.debtorAccount"), value: p.debtorAccount, isAddress: true }
      : null,
    p.debtorAgentBic ? { label: t("transactions.table.iso20022.debtorAgentBic"), value: p.debtorAgentBic } : null,
    p.creditorName ? { label: t("transactions.table.iso20022.creditorName"), value: p.creditorName } : null,
    p.creditorAccount
      ? { label: t("transactions.table.iso20022.creditorAccount"), value: p.creditorAccount, isAddress: true }
      : null,
    p.creditorAgentBic ? { label: t("transactions.table.iso20022.creditorAgentBic"), value: p.creditorAgentBic } : null,
    p.remittanceInfo ? { label: t("transactions.table.iso20022.remittance"), value: p.remittanceInfo } : null,
  ];

  return rows.filter((row): row is Field => row !== null);
});
</script>

<style lang="scss" scoped>
.iso20022-memo {
  @apply mt-2 flex flex-col gap-2 rounded-md border bg-neutral-100 px-4 py-3 text-sm;

  .iso20022-memo-toolbar {
    @apply flex items-center justify-end gap-2;

    .iso20022-memo-toggle {
      @apply rounded-md bg-primary-600 bg-opacity-[15%] px-3 py-1.5 text-primary-600 transition-colors hover:bg-opacity-10;
    }
  }

  .iso20022-memo-fields {
    @apply flex flex-col gap-1.5;

    .iso20022-memo-field {
      @apply flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2;

      .iso20022-memo-label {
        @apply w-40 shrink-0 text-gray-400;
      }
      .iso20022-memo-value {
        @apply break-all text-gray-800;
      }
    }
  }

  .iso20022-memo-raw {
    @apply max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border bg-white px-3 py-2 font-mono text-xs text-neutral-700;
  }

  .iso20022-memo-fallback {
    @apply flex flex-col gap-2;

    .iso20022-memo-fallback-note {
      @apply text-gray-400;
    }
  }
}
</style>
