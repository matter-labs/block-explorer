<template>
  <div class="transactions-empty-state">
    <EmptyState>
      <template #title>
        {{ t("contract.transactionTable.notFound.title") }}
      </template>
      <template #description>
        <div class="transactions-empty-description">
          {{ t("contract.transactionTable.notFound.subtitle") }}
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
  @apply flex py-16 lg:justify-center lg:py-28;
  .transactions-empty-description {
    @apply max-w-[23rem] whitespace-normal;
  }
}
</style>
