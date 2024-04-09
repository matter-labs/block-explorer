<template>
  <div class="function-array-parameter">
    <div class="function-input-label-container">
      <div class="function-input-label">{{ label }} ({{ type }})</div>
      <button v-if="!requiredArrayLength" class="function-add-button" type="button" @click="addField">
        <PlusIcon class="function-input-plus-icon" />
      </button>
    </div>
    <div v-for="(_, index) in inputted" :key="index" class="function-input-field-container">
      <Input
        v-model="inputted[index]"
        type="text"
        :disabled="disabled"
        :placeholder="`${label}[${index}] (${flatType})`"
        :error="errors[index]"
      />
      <button
        v-if="!requiredArrayLength"
        class="function-parameter-trash-button"
        type="button"
        @click="removeField(index)"
      >
        <TrashIcon class="function-input-field-trash-icon" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";

import { PlusIcon, TrashIcon } from "@heroicons/vue/outline";

import Input from "@/components/common/Input.vue";

import { getRawFunctionType, getRequiredArrayLength } from "@/utils/helpers";

const props = defineProps({
  label: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: null,
  },
  modelValue: {
    type: Array as PropType<string[] | string>,
    default: () => [],
  },
  errors: {
    type: Array as PropType<Array<string | undefined>>,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (eventName: "update:modelValue", value: string[]): void;
}>();

const inputted = computed({
  get: () => {
    if (!props.modelValue) {
      props.modelValue;
    }
    return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
  },
  set: (value: string[]) => {
    emit("update:modelValue", value);
  },
});

const flatType = computed(() => getRawFunctionType(props.type));
const requiredArrayLength = computed(() => getRequiredArrayLength(props.type));

const addField = () => {
  inputted.value = [...inputted.value, ""];
};
const removeField = (index: number) => {
  inputted.value.splice(index, 1);
};

if (requiredArrayLength.value && requiredArrayLength.value !== inputted.value.length) {
  inputted.value = Array(requiredArrayLength.value).fill("");
} else if (inputted.value.length === 0) {
  addField();
}
</script>

<style scoped lang="scss">
.function-array-parameter {
  @apply space-y-2 text-base;

  .function-input-plus-icon,
  .function-input-field-trash-icon {
    @apply h-5 w-5 cursor-pointer text-neutral-500 transition-colors duration-200 ease-in-out hover:text-neutral-400 active:text-neutral-500;
  }
  .function-input-label-container,
  .function-input-field-container {
    @apply flex items-center space-x-2;
  }
}
</style>
