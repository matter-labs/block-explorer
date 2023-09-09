<template>
  <div
    ref="el"
    class="solidity-editor-container"
    :class="{ focused, disabled, 'read-only': readOnly, expanded, error }"
    @click="focusEditor"
  >
    <PrismEditor
      class="solidity-editor"
      v-model="inputted"
      :highlight="highlighter"
      @focus="focused = true"
      @blur="focused = false"
      line-numbers
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { PrismEditor } from "vue-prism-editor";

import "vue-prism-editor/dist/prismeditor.min.css";

import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike.min";
import "prismjs/components/prism-solidity.min";
import "prismjs/themes/prism-solarizedlight.min.css";

const props = defineProps({
  modelValue: {
    type: String,
    default: null,
    required: false,
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false,
  },
  readOnly: {
    type: Boolean,
    default: false,
    required: false,
  },
  expanded: {
    type: Boolean,
    default: false,
    required: false,
  },
  error: {
    type: String,
    default: null,
  },
});

const focused = ref(false);
const el = ref<null | HTMLElement>(null);
const emit = defineEmits<{
  (eventName: "update:modelValue", value: string): void;
}>();

const inputted = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit("update:modelValue", value);
  },
});

function highlighter(code: string) {
  return highlight(code, languages.sol, "sol");
}

function focusEditor() {
  if (focused.value || props.disabled || props.readOnly) {
    return;
  }
  (el.value?.querySelector(".prism-editor__textarea") as HTMLTextAreaElement)?.focus();
}
</script>

<style lang="scss">
.solidity-editor-container {
  @apply block h-40 w-full overflow-hidden rounded-md border bg-neutral-50 shadow-sm ring-1 ring-transparent transition-colors;
  &.disabled {
    @apply bg-neutral-200;
  }
  &.read-only {
    @apply bg-neutral-100;
  }
  &.expanded {
    @apply h-max;
  }
  &.disabled,
  &.read-only {
    .prism-editor__textarea {
      @apply hidden;
    }
  }
  &:not(.error) {
    @apply border-neutral-300;
    &.focused:not(.disabled):not(.read-only) {
      @apply border-primary-600 ring-primary-600;
    }
  }
  &.error {
    @apply border-red-400;
    &.focused {
      @apply border-red-500 ring-red-500;
    }
  }

  .solidity-editor {
    @apply h-full w-full p-2 text-sm leading-snug;

    .prism-editor__line-numbers {
      @apply h-max;
    }
  }
}
</style>
