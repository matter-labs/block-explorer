<template>
  <div :class="{ 'two-section-view': tableInfoItems.length === 2 || loading }">
    <InfoTableSection :items="tableInfoItems[0]" :loading="loading" />
    <InfoTableSection :class="{ 'hide-mobile': loading }" :items="tableInfoItems[1]" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useWindowSize } from "@vueuse/core";

import InfoTableSection from "@/components/batches/InfoTableSection.vue";
import CopyContent from "@/components/common/table/fields/CopyContent.vue";
import TimeField from "@/components/common/table/fields/TimeField.vue";

import useContext from "@/composables/useContext";

import type { BatchDetails } from "@/composables/useBatch";
import type { Component, PropType } from "vue";

import { arrayHalfDivider } from "@/utils/helpers";

const { t } = useI18n();
const { width: screenWidth } = useWindowSize();
const { currentNetwork } = useContext();

const props = defineProps({
  batch: {
    type: Object as PropType<BatchDetails | null>,
    default: null,
  },
  batchNumber: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: true,
  },
});

const tableInfoItems = computed(() => {
  type InfoTableItem = {
    label: string;
    tooltip: string;
    value: string | number | null | Record<string, unknown>;
    component?: Component;
    url?: string;
  };

  let tableItems: InfoTableItem[] = [
    {
      label: t("batches.index"),
      tooltip: t("batches.indexTooltip"),
      value: props.batchNumber,
    },
  ];

  if (!props.batch) {
    return [tableItems];
  }

  tableItems.push(
    {
      label: t("batches.size"),
      tooltip: t("batches.sizeTooltip"),
      value: props.batch.l1TxCount + props.batch.l2TxCount,
    },
    {
      label: t("batches.timestamp"),
      tooltip: t("batches.timestampTooltip"),
      value: { value: props.batch.timestamp },
      component: TimeField,
    },
    {
      label: t("batches.rootHash"),
      tooltip: t("batches.rootHashTooltip"),
      value: props.batch.rootHash ? { value: props.batch.rootHash } : t("batches.noRootHashYet"),
      component: props.batch.rootHash ? CopyContent : undefined,
    }
  );
  for (const [key, timeKey] of [
    ["commitTxHash", "committedAt", "notYetCommitted"],
    ["proveTxHash", "provenAt", "notYetProven"],
    ["executeTxHash", "executedAt", "notYetExecuted"],
  ] as [keyof BatchDetails, keyof BatchDetails, string][]) {
    if (props.batch[key]) {
      tableItems.push(
        {
          label: t(`batches.${key}`),
          tooltip: t(`batches.${key}Tooltip`),
          value: { value: props.batch[key] },
          component: CopyContent,
          url: currentNetwork.value.l1ExplorerUrl
            ? `${currentNetwork.value.l1ExplorerUrl}/tx/${props.batch[key]}`
            : undefined,
        },
        {
          label: t(`batches.${timeKey}`),
          tooltip: t(`batches.${timeKey}Tooltip`),
          value: { value: props.batch[timeKey] },
          component: TimeField,
        }
      );
    }
  }

  if (screenWidth.value < 1024) {
    return [tableItems];
  }

  return arrayHalfDivider(tableItems);
});
</script>

<style lang="scss">
.two-section-view {
  @apply grid gap-4 pb-1.5 lg:grid-cols-2;
}
.hide-mobile {
  @apply hidden lg:block;
}
</style>
