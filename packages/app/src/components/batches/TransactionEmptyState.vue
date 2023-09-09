<template>
  <div class="transactions-empty-state">
    <EmptyState>
      <template #title>
        {{ t("batches.transactionTable.notFound.title") }}
      </template>
      <template #description>
        <div class="transactions-empty-description">
          {{ t("batches.transactionTable.notFound.subtitle") }}
        </div>
      </template>
    </EmptyState>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import EmptyState from "@/components/common/EmptyState.vue";

const { t } = useI18n();
</script>

<style scoped lang="scss">
.transactions-empty-state {
  @apply flex py-8 lg:justify-center;
  .transactions-empty-description {
    @apply max-w-[24rem] whitespace-pre-line;
    a {
      @apply text-neutral-400;
    }
  }
}
</style>
