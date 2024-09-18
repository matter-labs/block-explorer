<template>
  <Listbox as="div" :model-value="selected" class="network-switch relative">
    <ListboxButton
      class="toggle-button relative flex w-full min-w-[125px] items-center rounded-full bg-white px-2 py-2 text-base text-black hover:cursor-pointer focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
    >
      <span class="network-item flex items-center gap-1">
        <img :src="currentNetwork.icon" alt="Sophon logo" class="network-item-img h-8 w-8 flex-shrink-0" />
        <span class="network-item-label block truncate font-semibold">
          {{ currentNetwork.l2NetworkName }}
        </span>
        <img class="mx-2 top-px w-[0.8em]" src="/images/icons/chevron.svg" aria-hidden="true" />
      </span>
    </ListboxButton>
    <div class="network-list-wrapper absolute right-0 top-full h-auto w-full lg:w-[260px]">
      <ListboxOptions
        class="network-list absolute right-0 top-1 z-10 mb-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
      >
        <ListboxOption
          as="template"
          v-for="network in networks"
          :key="network.name"
          :value="network"
          v-slot="{ active, selected }"
        >
          <li class="network-list-item-container" :class="{ active, selected }">
            <component
              :is="selected ? 'label' : 'a'"
              :href="getNetworkUrl(network)"
              class="network-list-item"
              :class="{ selected }"
            >
              <span class="network-item flex items-center gap-1">
                <img
                  :src="network.icon"
                  :alt="`${network.l2NetworkName} logo`"
                  class="network-item-img h-8 w-8 flex-shrink-0"
                />
                <span class="network-item-label network-list-item-label block truncate font-semibold"
                  >{{ network.l2NetworkName }}
                </span>
              </span>
              <MinusCircleIcon v-if="network.maintenance" class="maintenance-icon" aria-hidden="true" />
            </component>
          </li>
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { MinusCircleIcon } from "@heroicons/vue/outline";

import useContext from "@/composables/useContext";

import type { NetworkConfig } from "@/configs";

import { getWindowLocation } from "@/utils/helpers";

const { networks, currentNetwork } = useContext();
const route = useRoute();
const selected = computed(() => {
  return currentNetwork.value;
});

const getNetworkUrl = (network: NetworkConfig) => {
  const hostname = getWindowLocation().hostname;

  if (hostname === "localhost" || hostname.endsWith("web.app") || !network.hostnames?.length) {
    return `${route.path}?network=${network.name}`;
  }
  return network.hostnames[0] + route.path;
};
</script>

<style scoped lang="scss">
.network-switch {
  .network-list-item-container {
    @apply flex items-center gap-2 px-3 py-2 text-neutral-900 lg:py-1;

    &:not(.selected) {
      cursor: pointer;
    }

    &.selected {
      background-color: var(--color-blue-lightest);
    }

    &:not(.selected).active,
    &:not(.selected):hover {
      @apply bg-neutral-100;
    }

    .network-list-item {
      @apply w-full font-sans text-base font-normal no-underline;

      &:not(.selected) {
        cursor: pointer;
      }
    }
  }

  .toggle-button-icon-wrapper {
    @apply pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1;

    .toggle-button-icon {
      @apply h-5 w-5 lg:text-white;
    }
  }
}
</style>
