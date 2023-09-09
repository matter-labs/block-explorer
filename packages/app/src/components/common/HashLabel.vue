<template>
  <span ref="root" class="hash-label-component" :title="text">
    <span ref="actualString" class="actual-string">{{ text }}</span>
    <span class="displayed-string">{{ displayedString }}</span>
    <span v-if="$slots.default" class="icon">
      <slot></slot>
    </span>
  </span>
</template>

<script lang="ts">
export function shortenFitText(
  text: string,
  placement = "middle",
  rootWidth = 0,
  singleCharacterWidth = 6,
  subtraction = 3
): string {
  const indexEnd =
    rootWidth && singleCharacterWidth ? Math.floor(rootWidth / singleCharacterWidth / 2) - subtraction : 13;

  if (rootWidth > singleCharacterWidth * text.length) {
    return text;
  }
  if (placement === "middle") {
    return `${text.substring(0, indexEnd)}...${text.substring(text.length - indexEnd, text.length)}`;
  }
  if (placement === "left") {
    return text.substring(0, indexEnd) + "..." + text.substring(text.length - 4, text.length);
  }
  if (placement === "right") {
    return text.substring(0, 5) + "..." + text.substring(text.length - indexEnd, text.length);
  }
  return "";
}
</script>

<script lang="ts" setup>
import { nextTick, ref, watch, watchEffect } from "vue";

import { useResizeObserver } from "@vueuse/core";

import type { MaybeElementRef } from "@vueuse/core";
import type { PropType } from "vue";

export type Placement = "middle" | "right" | "left";

const props = defineProps({
  text: {
    type: String,
    default: "",
    required: true,
  },
  subtraction: {
    type: Number,
    default: 3,
  },
  placement: {
    type: String as PropType<Placement>,
    default: "middle",
  },
});
const root = ref(null as Element | null);
const actualString = ref(null as Element | null);

const displayedString = ref("");

const calculateSingleCharacterWidth = () => {
  if (!actualString.value) {
    return 8;
  }
  return actualString.value.getBoundingClientRect().width / props.text.length;
};

const renderText = (rootWidth: number) => {
  const singleCharacterWidth = calculateSingleCharacterWidth();
  displayedString.value = shortenFitText(
    props.text,
    props.placement,
    rootWidth,
    singleCharacterWidth,
    props.subtraction
  );
};

watch(
  () => props.text,
  () => {
    nextTick(() => {
      if (root.value) {
        renderText(root.value.getBoundingClientRect().width);
      }
    });
  }
);

useResizeObserver(root as MaybeElementRef, (entries) => {
  // Wrap it in requestAnimationFrame to avoid this error - ResizeObserver loop limit exceeded
  window.requestAnimationFrame(() => {
    if (!Array.isArray(entries) || !entries.length) {
      return;
    }
    renderText(entries[0].contentRect.width);
  });
});

watchEffect(() => {
  if (root.value) {
    renderText(root.value.getBoundingClientRect().width);
  }
});
</script>

<style lang="scss" scoped>
.hash-label-component {
  @apply relative col-span-8 w-full overflow-hidden;

  .actual-string {
    @apply absolute left-0 top-0 text-transparent selection:text-transparent;
  }
  .displayed-string {
    @apply pointer-events-none select-none;
  }
  .icon {
    @apply ml-1 inline-block w-5 align-sub;
  }
}
</style>
