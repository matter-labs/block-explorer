<template>
  <Listbox as="div" v-model="selected" v-slot="{ open }">
    <ListboxButton
      :id="id"
      class="toggle-button"
      :class="{
        error: !pending && error.length,
        'toggle-button-focused': open,
      }"
      :disabled="pending"
    >
      <span v-if="!pending" class="toggle-button-value">
        {{ formatter(modelValue || defaultOption) }}
      </span>
      <LoadingIcon v-else class="loading" />
      <span v-if="!pending" class="toggle-button-icon-wrapper">
        <ChevronDownIcon class="toggle-button-icon" :class="{ 'toggle-button-opened': open }" />
      </span>
    </ListboxButton>
    <ListboxOptions class="options-list-container" :class="showAbove ? 'bottom-full mb-1' : 'top-full'">
      <ListboxOption
        as="template"
        v-for="option in options"
        v-slot="{ selected, active }"
        :key="option"
        :value="option"
      >
        <li class="options-list-item" :class="{ active }">
          {{ formatter(option) }}
          <span v-if="selected" class="check-icon-container">
            <CheckIcon class="check-icon" aria-hidden="true" />
          </span>
        </li>
      </ListboxOption>
    </ListboxOptions>
    <p v-if="!pending && error.length" class="dropdown-error">
      {{ error }}
    </p>
  </Listbox>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { CheckIcon, ChevronDownIcon } from "@heroicons/vue/solid";

import LoadingIcon from "@/components/icons/LoadingIcon.vue";
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  id: {
    type: String,
    default: "",
  },
  pending: {
    type: Boolean,
    default: false,
  },
  defaultOption: {
    type: String,
    default: "",
  },
  options: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  formatter: {
    type: Function as PropType<(value: unknown) => string>,
    default: (val: unknown) => val,
  },
  error: {
    type: String,
    default: "",
  },
  showAbove: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (eventName: "update:modelValue", value: string): void;
}>();

const selected = computed({
  get: () => (props.modelValue ? props.modelValue : props.options[0]),
  set: (value: string) => {
    emit("update:modelValue", value);
  },
});
</script>

<style scoped lang="scss">
.toggle-button {
  @apply grid h-[2.875rem] w-full grid-flow-col rounded-md border border-neutral-300 bg-neutral-50 p-3 text-left text-sm shadow-sm focus:outline-none;
  &.error {
    @apply border-error-400 text-error-500;
  }

  &:not(.error) {
    @apply focus:border-primary-600 focus:ring-1 focus:ring-primary-600;
  }

  .toggle-button-value {
    @apply overflow-hidden overflow-ellipsis whitespace-nowrap;
  }
  .toggle-button-icon-wrapper {
    @apply absolute inset-y-0 right-0 flex items-center pr-2;

    .toggle-button-icon {
      @apply w-5;
    }
    .toggle-button-opened {
      @apply rotate-180;
    }
  }
  .loading {
    @apply text-neutral-700;
  }
}
.toggle-button-focused {
  @apply border border-primary-600 ring-1 ring-primary-600;
}
.dropdown-error {
  @apply mt-0.5 text-sm text-error-500;
}
.options-list-container {
  @apply absolute z-20 mt-1 max-h-[180px] w-full cursor-pointer overflow-hidden overflow-y-auto rounded-md border-neutral-300 bg-white text-sm shadow-md focus:outline-none;
  .options-list-item {
    @apply px-3 py-3 hover:bg-neutral-100;

    &.active {
      @apply bg-neutral-100 px-3;
    }
    .check-icon-container {
      @apply absolute inset-y-0 right-3 flex items-center pl-3 text-neutral-800;
      .check-icon {
        @apply h-5 w-5;
      }
    }
  }
}
</style>
