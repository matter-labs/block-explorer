<template>
  <Tippy v-bind="$attrs" theme="dark" :on-show="() => (disabled ? false : undefined)">
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
  @apply rounded-lg text-sm shadow-sm shadow-night-900;
  &[data-theme~="dark"] {
    @apply bg-night-500 text-silver-400;
    &[data-placement^="top"] > .tippy-arrow:before {
      @apply border-t-night-500;
    }
    &[data-placement^="bottom"] > .tippy-arrow:before {
      @apply border-b-night-500;
    }
  }
}
</style>
