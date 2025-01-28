<template>
  <div class="holders-empty-state">
    <EmptyState>
      <template #title>
        {{ t("tokenHolders.notFound") }}
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
.holders-empty-state {
  @apply flex py-16 lg:justify-center lg:py-28;
  .holders-empty-description {
    @apply max-w-[23rem] whitespace-normal;
  }
}
</style>
