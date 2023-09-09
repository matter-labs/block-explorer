<template>
  <div class="alert-container" :class="type">
    <QuestionMarkCircleIcon v-if="type === 'notification'" class="info-tooltip-icon" aria-hidden="true" />
    <IconError v-else class="icon" :color="iconColor" />
    <div class="alert-body">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { QuestionMarkCircleIcon } from "@heroicons/vue/outline";

import IconError from "@/components/icons/IconError.vue";

import type { PropType } from "vue";

const props = defineProps({
  type: {
    type: String as PropType<"warning" | "error" | "notification">,
    default: "warning",
  },
});

const iconColor = computed(() => {
  return props.type === "warning" ? "#E69900" : "#f87171";
});
</script>

<style lang="scss" scoped>
.alert-container {
  @apply flex items-center rounded-lg p-4;

  .info-tooltip-icon {
    @apply h-5 w-5 text-neutral-400;
  }

  &.warning {
    @apply bg-warning-400 bg-opacity-50;
  }
  &.error {
    @apply bg-error-100 bg-opacity-50 text-error-500;
  }

  &.notification {
    @apply bg-neutral-200 text-neutral-600;
  }

  .alert-body {
    @apply ml-3 w-full;
  }
}
</style>
