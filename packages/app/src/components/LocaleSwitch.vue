<template>
  <Listbox as="div" v-model="selected" class="language-switch">
    <ListboxButton class="toggle-button">
      <span class="selected-language" v-if="selected">
        <span class="selected-language-label">{{ selected.label }}</span>
      </span>
      <span class="toggle-button-icon-wrapper">
        <ChevronDownIcon class="toggle-button-icon" aria-hidden="true" />
      </span>
    </ListboxButton>
    <div class="language-list-wrapper">
      <ListboxOptions class="language-list">
        <ListboxOption
          as="template"
          v-for="language in options"
          :key="language.value"
          :value="language"
          v-slot="{ active, selected }"
        >
          <li class="language-list-item" :class="{ active, selected }">
            <label class="language-list-item-label" :class="{ selected }">
              {{ language.label }}
            </label>
          </li>
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/solid";

import type { PropType } from "vue";

type Locale = {
  value: string;
  label: string;
};

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  options: {
    type: Array as PropType<Locale[]>,
    required: true,
  },
});
const emit = defineEmits(["update:value"]);

const selected = computed<Locale>({
  get: () => props.options.find((item) => item.value === props.value)!,
  set: (value) => {
    emit("update:value", value.value);
  },
});
</script>

<style scoped lang="scss">
.language-switch {
  @apply relative;

  .language-list-wrapper {
    @apply absolute right-0 top-full h-auto w-full lg:w-[60px];
  }
  .language-list {
    @apply absolute right-0 top-1 z-10 mb-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm;
  }

  .language-list-item {
    @apply flex items-center px-3 py-2 text-neutral-900 lg:py-1;
    &:not(.selected) {
      cursor: pointer;
    }
    &.selected {
      @apply bg-blue-300;
    }
    &:not(.selected).active,
    &:not(.selected):hover {
      @apply bg-blue-100;
    }

    .language-list-item-img {
      @apply mr-2 h-[18px] w-[18px] flex-shrink-0;
    }
    .language-list-item-label {
      @apply w-full font-sans text-base font-normal text-neutral-700;
      &:not(.selected) {
        cursor: pointer;
      }
    }
  }

  .toggle-button {
    @apply relative flex w-full min-w-[65px] items-center rounded-md border border-neutral-300 bg-white px-2 py-2 font-sans text-base text-neutral-700 hover:cursor-pointer focus:border-white active:bg-white active:text-gray-600 lg:border-gray-700 hover:shadow lg:bg-black lg:text-white;

    .selected-language {
      @apply mr-5 flex items-center gap-1.5;

      .selected-language-img {
        @apply h-4 w-4 flex-shrink-0;
      }
      .selected-language-label {
        @apply block truncate;
      }
    }
  }

  .toggle-button-icon-wrapper {
    @apply pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1;

    .toggle-button-icon {
      @apply h-5 w-5 text-neutral-700 lg:text-white;
    }
  }
}
</style>
