<template>
  <Tooltip>
    <div class="info-tooltip">
      <QuestionMarkCircleIcon class="info-tooltip-icon" aria-hidden="true" />
    </div>

    <template #content>
      <slot />
    </template>
  </Tooltip>
</template>

<script lang="ts" setup>
import { QuestionMarkCircleIcon } from "@heroicons/vue/outline";

import Tooltip from "@/components/common/Tooltip.vue";
</script>

<style lang="scss">
.info-tooltip {
  .info-tooltip-icon {
    @apply h-4 w-4 text-neutral-400;
  }
  .info-tooltip-text {
    @apply z-10;

    .tooltip-inner .tooltip-content {
      @apply max-w-sm whitespace-pre-line;
    }
  }
}
</style>
