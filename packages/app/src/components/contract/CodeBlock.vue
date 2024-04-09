<template>
  <div class="code-block-container">
    <div class="code-block-header">
      <div class="code-block-label">{{ label }}</div>
      <div class="code-block-buttons">
        <CopyButton :value="code" />
        <button class="expand-button" @click="expanded = !expanded">
          <ChevronUpDown v-if="!expanded" class="expand-icon" />
          <ChevronDownUp v-else class="expand-icon" />
        </button>
      </div>
    </div>
    <SolidityEditor :modelValue="code" :readOnly="true" :expanded="expanded" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import SolidityEditor from "@/components/SolidityEditor.vue";
import CopyButton from "@/components/common/CopyButton.vue";
import ChevronDownUp from "@/components/icons/ChevronDownUp.vue";
import ChevronUpDown from "@/components/icons/ChevronUpDown.vue";

defineProps({
  label: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
});

const expanded = ref(false);
</script>

<style lang="scss">
.code-block-container {
  .code-block-header {
    @apply sticky top-0 z-10 mb-1 flex items-center justify-between bg-white text-neutral-700;

    .code-block-label {
      @apply text-left text-sm;
    }
    .code-block-buttons {
      @apply flex items-center gap-1;

      .copy-button {
        @apply pl-1.5 pt-0.5;
      }
      .expand-button {
        @apply rounded-md p-1.5 text-neutral-500 transition-colors hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500;

        .expand-icon {
          @apply h-4 w-4;
        }
      }
    }
  }
}
</style>
