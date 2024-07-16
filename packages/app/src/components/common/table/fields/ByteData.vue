<template>
  <div class="info-field-byte-data">
    <Disclosure v-slot="{ open }">
      <DisclosureButton
        class="byte-data-disclosure-btn bg-gray/10 flex font-medium items-center justify-between px-4 py-2 text-gray text-left text-sm w-full focus:outline-none hover:bg-gray/5"
        :class="open ? 'rounded-tl-lg rounded-tr-lg' : 'rounded-lg'"
        :data-testid="$testId.byteCodeDropDown"
      >
        <HashLabel :text="value" :subtraction="5" />
        <div class="byte-data-disclosure-icons flex items-center">
          <CopyButton class="mr-1" tooltipPosition="left" :value="value" />
          <ChevronDownIcon :class="open ? 'rotate-180 transform' : ''" class="h-5 w-5 text-gray transition-transform" />
        </div>
      </DisclosureButton>
      <DisclosurePanel
        class="byte-data-disclosure-panel border border-dashed border-gray border-t-0 px-4 py-4 rounded-bl-lg rounded-br-lg"
      >
        <div class="byte-data-full-value break-all break-words overflow-hidden text-gray text-sm whitespace-pre-line">
          {{ value }}
        </div>
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

<!-- <style lang="scss">
</style> -->
