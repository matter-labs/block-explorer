<template>
  <label class="checkbox-input-container" :class="{ checked: inputted }">
    <input type="checkbox" :checked="inputted" v-model="inputted" v-bind="$attrs" />
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

  input {
    @apply me-1 cursor-pointer rounded border-neutral-200 text-primary-600 ring-transparent checked:border-primary-600 hover:border-primary-600;
  }
}
</style>
