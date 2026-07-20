<template>
  <TableBodyColumn class="empty-state-container" colspan="3">
    <EmptyState class="empty-state">
      <template #title>
        {{
          runtimeConfig.appEnvironment === "prividium"
            ? t("contract.events.prividiumNotFound")
            : t("contract.events.notFound")
        }}
      </template>
      <template #description><span></span></template>
    </EmptyState>
  </TableBodyColumn>
</template>
<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import EmptyState from "@/components/common/EmptyState.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";

import useRuntimeConfig from "@/composables/useRuntimeConfig";

const { t } = useI18n();
const runtimeConfig = useRuntimeConfig();
</script>
<style lang="scss" scoped>
.empty-state-container {
  @apply table-cell;
  .empty-state {
    @apply items-center justify-center whitespace-normal py-10;
  }
}
</style>
