<template>
  <div class="transactions-empty-state">
    <EmptyState class="empty-state">
      <template #title>
        {{ blockExists ? t("blocks.transactionTable.noTransactions") : t("blocks.transactionTable.blockNotFound") }}
      </template>
      <template #description><span></span></template>
    </EmptyState>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import EmptyState from "@/components/common/EmptyState.vue";

const { t } = useI18n();

defineProps({
  blockExists: {
    type: Boolean,
    required: true,
  },
});
</script>

<style scoped lang="scss">
.empty-state {
  @apply items-center justify-center whitespace-normal py-10;
}
</style>
