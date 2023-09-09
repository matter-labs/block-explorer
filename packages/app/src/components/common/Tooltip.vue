<template>
  <Tippy v-bind="$attrs" theme="light" :on-show="() => (disabled ? false : undefined)">
    <template #default>
      <slot />
    </template>
    <template #content>
      <slot name="content" />
    </template>
  </Tippy>
</template>

<script lang="ts" setup>
import { Tippy } from "vue-tippy";

import type { PropType } from "vue";

export type TooltipPosition = "top" | "left" | "right";

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  position: {
    type: String as PropType<TooltipPosition>,
    default: "top",
  },
});
</script>

<style lang="scss">
.tippy-box {
  @apply rounded-lg text-sm;
  &[data-theme~="light"] {
    @apply bg-neutral-400 text-white;
    &[data-placement^="top"] > .tippy-arrow:before {
      @apply border-t-neutral-400;
    }
    &[data-placement^="bottom"] > .tippy-arrow:before {
      @apply border-b-neutral-400;
    }
  }
}
</style>
