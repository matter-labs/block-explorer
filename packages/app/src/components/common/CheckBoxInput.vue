<template>
  <label class="checkbox-input-container" :class="{ checked: inputted, disabled }">
    <input type="checkbox" v-model="inputted" v-bind="$attrs" :disabled="disabled" />
    <slot />
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
    type: Boolean,
    default: null,
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
.checkbox-input-container {
  @apply float-right mb-1 flex cursor-pointer items-center leading-snug;

  &.disabled {
    @apply cursor-default opacity-50;

    input {
      @apply cursor-default hover:border-neutral-200;
    }
  }

  input {
    @apply me-1 cursor-pointer rounded border-neutral-200 text-primary-600 ring-transparent checked:border-primary-600 hover:border-primary-600 disabled:opacity-50;
  }
}
</style>
