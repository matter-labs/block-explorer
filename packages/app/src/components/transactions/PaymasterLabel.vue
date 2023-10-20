<template>
  <div class="paymaster-label">
    {{ t("transactions.table.feeDetails.paymaster") }}
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<style scoped lang="scss">
.paymaster-label {
  @apply h-[20px] px-1 rounded bg-neutral-200 text-center text-sm text-gray-600;
}
</style>
