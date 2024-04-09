<template>
  <Listbox as="div" v-model="selected" class="convert-dropdown-container">
    <ListboxButton class="toggle-button">
      <div class="selected-option" v-if="selected">
        {{ t(`transactions.logs.options.${selected}`) }}
      </div>
      <ChevronDownIcon class="toggle-button-icon" aria-hidden="true" />
    </ListboxButton>
    <ListboxOptions
      class="option-list"
      :class="{ 'opens-up': popoverPlacement === 'top', 'opens-right': popoverPlacement === 'right' }"
    >
      <ListboxOption
        as="template"
        v-for="option in options"
        :key="option"
        :value="option"
        v-slot="{ active, selected }"
      >
        <li class="option-list-item" :class="{ active, selected }">
          {{ t(`transactions.logs.options.${option}`) }}
          <CheckIcon v-show="selected" class="check-icon" />
        </li>
      </ListboxOption>
    </ListboxOptions>
  </Listbox>
  <slot :data="convertedValue" :selected="selected"></slot>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { CheckIcon, ChevronDownIcon } from "@heroicons/vue/outline";

import { formatHexDecimals } from "@/utils/formatters";

export type DecodingType = "hex" | "number" | "text" | "address";

const props = defineProps({
  hash: {
    type: String,
    default: "",
  },
  defaultType: {
    type: String as PropType<DecodingType>,
    default: "hex",
  },
  popoverPlacement: {
    type: String as PropType<"top" | "bottom" | "right">,
    default: "bottom",
  },
});

const { t } = useI18n();

const options: DecodingType[] = ["hex", "number", "text", "address"];

const selected = ref(props.defaultType);

const convertedValue = computed(() => {
  if (selected.value === "number") {
    return formatHexDecimals(props.hash, "Dec");
  } else if (selected.value === "address") {
    return formatHexDecimals(props.hash, "Hex");
  } else if (selected.value === "text") {
    return hexStringToUTF8(props.hash);
  } else {
    return props.hash;
  }
});

function hexStringToUTF8(hexString: string): string {
  const hex = hexString.replace(/^0x/, "");
  const bytes = hex.match(/.{2}/g) || [];
  const chars = bytes.map((byte) => String.fromCharCode(parseInt(byte, 16)));
  return chars.join("");
}
</script>

<style scoped lang="scss">
.convert-dropdown-container {
  @apply relative block h-max;
  .option-list {
    @apply absolute left-0 top-full z-10 mb-1 max-h-56 overflow-auto rounded-md bg-white py-1 text-base shadow-lg focus:outline-none sm:text-sm;
    &.opens-up {
      @apply bottom-full top-auto;
    }
    &.opens-right {
      @apply bottom-[calc(100%-32px)] left-[calc(100%+0.25rem)] top-auto;
    }
    .option-list-item {
      @apply px-3 py-2 text-neutral-900 lg:py-1;
      &.selected {
        @apply bg-neutral-200;
      }
      &:not(.selected).active,
      &:hover {
        @apply cursor-pointer bg-neutral-200;
      }
      .check-icon {
        @apply ml-4 inline-block h-4 w-4;
      }
    }
  }

  .toggle-button {
    @apply flex h-7 w-max items-center rounded bg-neutral-200 px-2 leading-6 text-neutral-700 hover:cursor-pointer focus:outline-none focus:ring-2;

    .selected-option-label {
      @apply mr-5 block truncate text-sm leading-6;
    }
    .toggle-button-icon {
      @apply ml-2 h-5 w-5 text-neutral-700;
    }
  }
}
</style>
