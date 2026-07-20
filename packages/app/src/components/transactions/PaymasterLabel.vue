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
  @apply h-[20px] rounded bg-neutral-200 px-1 text-center text-sm text-gray-600;
}
</style>
