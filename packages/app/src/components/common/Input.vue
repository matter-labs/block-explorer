<template>
  <div class="input-container">
    <input v-bind="$attrs" v-model="inputted" class="input" :class="{ error }" />
    <transition
      enter-active-class="transition ease duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="error" class="input-error-tooltip">
        <Tooltip class="relative h-5 w-5">
          <ExclamationCircleIcon class="h-full w-full text-error-500" aria-hidden="true" />

          <template #content>{{ error }}</template>
        </Tooltip>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { computed } from "vue";

import { ExclamationCircleIcon } from "@heroicons/vue/outline";

import Tooltip from "@/components/common/Tooltip.vue";

import type { PropType } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number] as PropType<string[] | string | number | null>,
    default: null,
  },
  error: {
    type: String,
    default: null,
  },
});

const emit = defineEmits<{
  (eventName: "update:modelValue", value: string | number | null): void;
}>();

const inputted = computed({
  get: () => (Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue),
  set: (value: string | number | null) => {
    emit("update:modelValue", value);
  },
});
</script>

<style lang="scss" scoped>
.input-container {
  @apply relative w-full;

  .input {
    @apply block w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 text-sm shadow-sm transition-colors focus:outline-none;
    &:disabled {
      @apply cursor-not-allowed bg-neutral-200 text-neutral-500;
    }
    &::placeholder {
      @apply text-neutral-400;
    }
    &:not(.error) {
      @apply border-neutral-300 focus:border-primary-600 focus:ring-primary-600;
    }
    &.error {
      @apply border-error-400 pr-8 text-error-500 focus:border-error-500 focus:ring-error-500;
    }
  }
  .input-error-tooltip {
    @apply absolute inset-y-0 right-0 flex items-center justify-center pr-3;
  }
}
</style>
