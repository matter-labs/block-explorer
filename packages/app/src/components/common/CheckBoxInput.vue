<template>
  <label class="checkbox-input-container" :class="{ checked: value }">
    <input type="checkbox" :checked="value" v-model="inputted" v-bind="$attrs" />
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
  value: {
    type: Boolean,
    required: true,
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
  @apply flex items-center mb-1 cursor-pointer float-right leading-snug;

  input {
    @apply rounded me-1 text-primary-600 cursor-pointer border-neutral-200 checked:border-primary-600 hover:border-primary-600 ring-transparent;
  }
}
</style>
