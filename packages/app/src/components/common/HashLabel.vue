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
function hexToAscii(hex: string): string {
  let asciiStr = "";

  // Make sure hex length is even
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  for (let i = 0; i < hex.length; i += 2) {
    // Convert each pair of hex digits to an ASCII character
    const hexByte = hex.slice(i, i + 2);
    const charCode = parseInt(hexByte, 16);
    asciiStr += String.fromCharCode(charCode);
  }

  return asciiStr;
}
function parseEthereumAddress(address: string): string | null {
  // Check if the address starts with "0x"
  if (!address.startsWith("0x")) {
    return null;
    //throw new Error("Invalid Ethereum address format. Address should start with '0x'.");
  }

  // Remove the "0x" prefix
  const cleanAddress = address.slice(2);

  // Check if the first 20 characters (10 bytes) are all zeroes
  const zeroBytes = "00000000000000000000"; // 20 characters of zero

  if (cleanAddress.startsWith(zeroBytes)) {
    // Extract the rest of the address after the 10 zero bytes
    let restOfAddress = cleanAddress.slice(20);
    // Remove leading "00" hex values from the rest of the address
    restOfAddress = restOfAddress.replace(/^0+/, "");
    restOfAddress = restOfAddress.toLowerCase();

    // Convert the remaining part of the address from hex to ASCII
    try {
      const asciiString = hexToAscii(restOfAddress);
      // System contract
      if (asciiString.length < 3) {
        return null;
      }
      return asciiString;
    } catch (error) {
      console.error("Failed to parse the remaining address as hex ASCII.");
      return null;
    }
  }

  return null; // If the address doesn't start with 10 bytes of zeroes
}

export function shortenFitText(
  text: string,
  placement = "middle",
  rootWidth = 0,
  singleCharacterWidth = 6,
  subtraction = 3
): string {
  if (parseEthereumAddress(text) != null) {
    text = parseEthereumAddress(text)!;
  }

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
