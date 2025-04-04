<template>
  <label class="toggle-switch-container">
    <span class="toggle-label">{{ labelLeft }}</span>
    <div class="toggle-switch" :class="{ checked: inputted }" @click="toggle">
      <div class="toggle-handle"></div>
    </div>
    <span v-if="labelRight" class="toggle-label">{{ labelRight }}</span>
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
    required: true,
  },
  labelLeft: {
    type: String,
    required: true,
  },
  labelRight: {
    type: String,
    required: false,
  },
});

const emit = defineEmits<{
  (eventName: "update:modelValue", value: boolean): void;
  (eventName: "onChanged", value: boolean): void;
}>();

const inputted = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit("update:modelValue", value);
    emit("onChanged", value);
  },
});

const toggle = () => {
  inputted.value = !inputted.value;
};
</script>

<style lang="scss" scoped>
.toggle-switch-container {
  @apply flex items-center gap-2;

  .toggle-label {
    @apply text-sm font-medium text-neutral-700;
  }

  .toggle-switch {
    @apply flex items-center w-10 h-5 border border-neutral-300 bg-neutral-50 rounded-full relative cursor-pointer transition-colors duration-300 ease-in-out;
  }

  .toggle-handle {
    @apply bg-blue border-2 border-neutral-50 rounded-full absolute w-4 h-4 transition-transform duration-300;
  }

  .toggle-switch.checked .toggle-handle {
    transform: translateX(calc(100% + 0.25em));
  }
}
</style>
