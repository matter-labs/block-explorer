<template>
  <div class="info-field-abi-data">
    <Disclosure v-slot="{ open }">
      <DisclosureButton
        class="abi-data-disclosure-btn"
        :class="open ? 'rounded-tl-lg rounded-tr-lg' : 'rounded-lg'"
        :data-testid="$testId.abiDataDropDown"
      >
        {{ truncatedAbi }}

        <div class="abi-data-disclosure-icons">
          <CopyButton class="mr-1" tooltipPosition="left" :value="value" />
          <ChevronDownIcon
            :class="open ? 'rotate-180 transform' : ''"
            class="h-5 w-5 text-gray-500 transition-transform"
          />
        </div>
      </DisclosureButton>
      <DisclosurePanel class="abi-data-disclosure-panel">
        <div class="abi-data-full-value">{{ value }}</div>
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/solid";

import CopyButton from "@/components/common/CopyButton.vue";

const props = defineProps({
  value: {
    type: String,
    default: "",
    required: true,
  },
});

const truncatedAbi = computed<string>(() => {
  return props.value.replace(/(.{600})..+/, "$1...");
});
</script>

<style lang="scss">
.info-field-abi-data {
  .abi-data-disclosure-btn {
    @apply flex w-full items-center justify-between bg-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-900 [word-break:break-word] hover:bg-gray-200 focus:outline-none;
  }
  .abi-data-disclosure-icons {
    @apply flex items-center;
  }
  .abi-data-disclosure-panel {
    @apply rounded-bl-lg rounded-br-lg border border-t-0 border-dashed border-gray-300 px-4 py-4;

    .abi-data-full-value {
      @apply overflow-hidden whitespace-pre-line break-words break-all text-sm text-gray-700;
    }
  }
}
</style>
