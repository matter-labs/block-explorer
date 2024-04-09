<template>
  <div class="copy-button-container">
    <button ref="copyButton" type="button" class="copy-button" @click.prevent="copyToClipboard">
      <slot>
        <DocumentDuplicateIcon class="copy-button-icon" aria-hidden="true" />
      </slot>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useTippy } from "vue-tippy";

import { DocumentDuplicateIcon } from "@heroicons/vue/outline/index.js";
import { useClipboard, useThrottleFn } from "@vueuse/core";

const { t } = useI18n();

const props = defineProps({
  value: {
    type: [String, Number],
    default: "",
    required: true,
  },
});
const { copy, copied: isCopied } = useClipboard({
  source: computed(() => props.value?.toString()),
  copiedDuring: 1000,
});

const copyButton = ref<Element | undefined>(undefined);
const { show, hide } = useTippy(copyButton!, {
  content: t("copyButton.tooltip"),
  trigger: "manual",
  theme: "light",
});

const tooltipShownViaLegacyCopy = ref(false);
const showLegacyCopyTooltip = useThrottleFn(() => {
  tooltipShownViaLegacyCopy.value = true;
  setTimeout(() => {
    tooltipShownViaLegacyCopy.value = false;
  }, 1000);
}, 1000);

watchEffect(() => {
  if (isCopied.value || tooltipShownViaLegacyCopy.value) {
    show();
  } else {
    hide();
  }
});

async function copyToClipboard() {
  try {
    await copy();
  } catch (error) {
    legacyCopy();
    showLegacyCopyTooltip();
  }
}

function legacyCopy() {
  const ta = document.createElement("textarea");
  ta.value = props.value != null ? props.value?.toString() : "";
  ta.style.position = "absolute";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}
</script>

<style lang="scss" scoped>
.copy-button-container {
  @apply relative h-6 w-6;

  .copy-button {
    @apply absolute -left-1 -top-1 rounded-md p-1 text-neutral-500 transition-colors hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500;

    .copy-button-icon {
      @apply inline-block h-5 w-5 rounded-full;
    }
  }
}
</style>
