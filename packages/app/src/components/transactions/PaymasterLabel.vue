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
  @apply h-[20px] px-1 rounded bg-night-900 text-center text-sm text-night-500;
}
</style>
