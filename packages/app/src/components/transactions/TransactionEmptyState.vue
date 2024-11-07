<template>
  <div class="transactions-empty-state">
    <EmptyState>
      <template #title>
        {{ t("transactions.table.notFound") }}
      </template>
      <template #description>
        <div class="transactions-empty-description">
          {{ t("transactions.table.notFoundSubtitle") }}
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
  @apply flex py-[1.4rem] lg:justify-center lg:py-16;
  .transactions-empty-description {
    @apply max-w-[23rem] whitespace-normal;
  }
}
</style>
