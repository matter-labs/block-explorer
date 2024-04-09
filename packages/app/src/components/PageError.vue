<template>
  <div class="error-page-container">
    <div class="error-page-icon-container">
      <IconError color="white" />
    </div>
    <div class="error-page-title">{{ t("pageError.title") }}</div>
    <div class="error-page-subtitle">{{ t("pageError.subtitle") }}</div>
    <Button class="home-button" tag="RouterLink" :to="{ name: 'home' }">{{ t("pageError.button") }}</Button>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import Button from "@/components/common/Button.vue";
import IconError from "@/components/icons/IconError.vue";

const { t } = useI18n();
</script>

<style scoped lang="scss">
.error-page-container {
  @apply flex flex-col items-center gap-y-4 rounded-md bg-white px-6 py-4 text-center shadow-md;
  .error-page-icon-container {
    @apply flex h-14 w-14 items-center justify-center rounded-full bg-error-500;
  }
  .error-page-title {
    @apply text-2xl font-bold;
  }
  .error-page-subtitle {
    @apply text-base;
  }
  .home-button {
    @apply no-underline;
  }
}
</style>
