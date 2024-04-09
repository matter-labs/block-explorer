<template>
  <div class="info-field-byte-data">
    <Disclosure v-slot="{ open }">
      <DisclosureButton
        class="byte-data-disclosure-btn"
        :class="open ? 'rounded-tl-lg rounded-tr-lg' : 'rounded-lg'"
        :data-testid="$testId.byteCodeDropDown"
      >
        <HashLabel :text="value" :subtraction="5" />
        <div class="byte-data-disclosure-icons">
          <CopyButton class="mr-1" tooltipPosition="left" :value="value" />
          <ChevronDownIcon
            :class="open ? 'rotate-180 transform' : ''"
            class="h-5 w-5 text-gray-500 transition-transform"
          />
        </div>
      </DisclosureButton>
      <DisclosurePanel class="byte-data-disclosure-panel">
        <div class="byte-data-full-value">{{ value }}</div>
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>

<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/solid";

import CopyButton from "@/components/common/CopyButton.vue";
import HashLabel from "@/components/common/HashLabel.vue";

defineProps({
  value: {
    type: String,
    default: "",
    required: true,
  },
});
</script>

<style lang="scss">
.info-field-byte-data {
  .byte-data-disclosure-btn {
    @apply flex w-full items-center justify-between bg-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none;
  }
  .byte-data-disclosure-icons {
    @apply flex items-center;
  }
  .byte-data-disclosure-panel {
    @apply rounded-bl-lg rounded-br-lg border border-t-0 border-dashed border-gray-300 px-4 py-4;

    .byte-data-full-value {
      @apply overflow-hidden whitespace-pre-line break-words break-all text-sm text-gray-700;
    }
  }
}
</style>
