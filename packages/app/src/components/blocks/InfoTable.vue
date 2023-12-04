<template>
  <div :class="{ 'two-section-view': tableInfoItems.length === 2 || loading }">
    <InfoTableBlock :items="tableInfoItems[0]" :loading="loading" :loading-rows-amount="6" />
    <InfoTableBlock :class="{ 'hide-mobile': loading }" :items="tableInfoItems[1]" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useWindowSize } from "@vueuse/core";

import InfoTableBlock from "@/components/blocks/InfoTableBlock.vue";
import CopyContent from "@/components/common/table/fields/CopyContent.vue";
import TimeField from "@/components/common/table/fields/TimeField.vue";

import useContext from "@/composables/useContext";

import type { Block } from "@/composables/useBlock";
import type { Params } from "react-router";
import type { Component, PropType } from "vue";

import { arrayHalfDivider } from "@/utils/helpers";

const { t } = useI18n();
const { width: screenWidth } = useWindowSize();
const { currentNetwork } = useContext();

const props = defineProps({
  block: {
    type: Object as PropType<Block | null>,
    default: null,
  },
  blockNumber: {
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
    route?: {
      name: string;
      params: Params;
      disabled?: boolean;
      disabledTooltip?: string;
    };
  };
  let tableItems: InfoTableItem[] = [
    { label: t("blocks.table.blockNumber"), tooltip: t("blocks.table.blockNumberTooltip"), value: props.blockNumber },
  ];
  if (!props.block) {
    return [tableItems];
  }
  tableItems.push(
    {
      label: t("blocks.table.blockSize"),
      tooltip: t("blocks.table.blockSizeTooltip"),
      value: props.block.l1TxCount + props.block.l2TxCount,
    },
    {
      label: t("blocks.table.status"),
      tooltip: t("blocks.table.statusTooltip"),
      value: t(`blocks.status.${props.block.status}`),
    },
    {
      label: t("blocks.table.batch"),
      tooltip: t("blocks.table.batchTooltip"),
      value: props.block.l1BatchNumber ?? undefined,
      ...(props.block.l1BatchNumber
        ? {
            route: {
              name: "batch",
              params: {
                id: props.block.l1BatchNumber.toString(),
              },
              disabled: !props.block.isL1BatchSealed,
              disabledTooltip: t("batches.notYetSealed"),
            },
          }
        : {}),
    },
    {
      label: t("blocks.table.rootHash"),
      tooltip: t("blocks.table.rootHashTooltip"),
      value: props.block.hash ? { value: props.block.hash } : t("blocks.table.noRootHashYet"),
      component: props.block.hash ? CopyContent : undefined,
    },
    {
      label: t("blocks.table.timestamp"),
      tooltip: t("blocks.table.timestampTooltip"),
      value: { value: props.block.timestamp },
      component: TimeField,
    }
  );
  for (const [key, timeKey] of [
    ["commitTxHash", "committedAt", "notYetCommitted"],
    ["proveTxHash", "provenAt", "notYetProven"],
    ["executeTxHash", "executedAt", "notYetExecuted"],
  ] as [keyof Block, keyof Block, string][]) {
    if (props.block[key]) {
      tableItems.push(
        {
          label: t(`blocks.table.${key}`),
          tooltip: t(`blocks.table.${key}Tooltip`),
          value: { value: props.block[key] },
          component: CopyContent,
          url: currentNetwork.value.l1ExplorerUrl
            ? `${currentNetwork.value.l1ExplorerUrl}/tx/${props.block[key]}`
            : undefined,
        },
        {
          label: t(`blocks.table.${timeKey}`),
          tooltip: t(`blocks.table.${timeKey}Tooltip`),
          value: { value: props.block[timeKey] },
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
