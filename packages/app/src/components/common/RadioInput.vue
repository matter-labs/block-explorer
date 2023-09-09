<template>
  <label class="radio-input-container" :class="{ checked: value === inputted, disabled }">
    <input class="sr-only" type="radio" :disabled="disabled" :value="value" v-bind="$attrs" v-model="inputted" />
    <div class="radio-handle">
      <div class="radio-handle-dot"></div>
    </div>
    <div class="radio-input-text">
      <slot />
    </div>
  </label>
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  value: {
    type: [String, Number, Boolean],
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (eventName: "update:modelValue", value: unknown): void;
}>();

const inputted = computed({
  get: () => props.modelValue,
  set: (value: unknown) => {
    emit("update:modelValue", value);
  },
});
</script>

<style lang="scss" scoped>
.radio-input-container {
  @apply flex cursor-pointer items-center transition-opacity;

  input[type="radio"]:focus ~ .radio-handle {
    @apply ring-2 ring-primary-600;
  }
  &:not(.checked):not(.disabled):hover {
    .radio-handle {
      @apply border-primary-600;
    }
  }
  &.checked {
    .radio-handle .radio-handle-dot {
      @apply opacity-100;
    }
  }
  &.disabled {
    @apply cursor-not-allowed opacity-60;
  }

  .radio-handle {
    @apply relative flex h-5 w-5 items-center justify-center rounded-full border border-neutral-200 transition-colors;

    .radio-handle-dot {
      @apply h-3 w-3 rounded-full bg-primary-600 opacity-0 transition-opacity;
    }
  }
  .radio-input-text {
    @apply ml-3 block text-sm font-medium text-neutral-700;
  }
}
</style>
