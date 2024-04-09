<template>
  <div class="expandable-text" :class="{ expanded }">
    <div class="expandable-text-content" :style="{ 'max-height': expanded ? 'inherit' : `${maxHeight}px` }">
      <div ref="el">
        <slot />
      </div>
    </div>
    <button v-if="showButton" class="expand-button" type="button" @click="expanded = !expanded">
      <slot name="button" :expanded="expanded" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { useResizeObserver } from "@vueuse/core";

import type { MaybeElementRef } from "@vueuse/core";

const props = defineProps({
  maxHeight: {
    type: Number,
    required: false,
    default: 48,
  },
});

const expanded = ref(false);
const el = ref<null | HTMLElement>(null);
const showButton = ref(true);

useResizeObserver(el as MaybeElementRef, (entries) => {
  const entry = entries[0];
  const { height } = entry.contentRect;
  showButton.value = height > props.maxHeight;
});
</script>

<style lang="scss" scoped>
.expandable-text {
  @apply relative w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-2;

  &.expanded {
    .expandable-text-content {
      @apply max-h-[initial] overflow-auto;
    }
  }

  .expandable-text-content {
    @apply overflow-hidden;
  }
  .expand-button {
    @apply underline;
  }
}
</style>
