<template>
  <div class="transactions-empty-state">
    <EmptyState>
      <template #title>
        {{ t("blocks.transactionTable.notFound.title") }}
      </template>
      <template #description>
        <div class="transactions-empty-description">
          {{ t("blocks.transactionTable.notFound.subtitle") }}
          <a :href="t('blocks.transactionTable.notFound.url')" target="_blank">
            {{ t("blocks.transactionTable.notFound.urlTitle") }}
          </a>
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
    @apply max-w-[24rem] whitespace-normal;
    a {
      @apply text-neutral-400;
    }
  }
}
</style>
