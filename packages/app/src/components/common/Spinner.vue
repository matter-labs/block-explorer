<template>
  <div class="spinner-icon" :class="[size, color, { 'is-outlined': outline }]"></div>
</template>
<script lang="ts" setup>
import type { PropType } from "vue";

defineProps({
  size: {
    type: String as PropType<"xs" | "sm" | "md" | "lg">,
    default: "sm",
  },
  color: {
    type: String as PropType<"neutral" | "primary" | "dark-neutral">,
    default: "neutral",
  },
  outline: {
    type: Boolean,
    default: false,
  },
});
</script>
<style lang="scss">
.spinner-icon {
  @apply inline-flex h-6 w-6 animate-spin rounded-full border-2;
  &.md {
    @apply h-10 w-10 border-4;
  }
  &.lg {
    @apply h-12 w-12 border-4;
  }
  &.xs {
    @apply h-4 w-4 border-2;
  }

  &.is-outlined {
    &.neutral {
      @apply border-neutral-700 border-l-transparent;
    }
    &.primary {
      @apply border-blue border-l-transparent;
    }
  }
  &:not(.is-outlined) {
    &.neutral {
      @apply border-l-neutral-700;
    }
    &.primary {
      @apply border-l-blue;
    }
  }
  &.dark-neutral {
    @apply border-transparent border-l-neutral-700;
  }
}
</style>
