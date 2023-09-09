<template>
  <div class="info-tooltip-with-content">
    <InfoTooltip :disabled="true" />
    <div class="text-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import InfoTooltip from "@/components/common/InfoTooltip.vue";
</script>

<style lang="scss">
.info-tooltip-with-content {
  @apply inline-flex w-full items-center whitespace-normal;

  .text-content {
    @apply ml-2;
  }
}
</style>
