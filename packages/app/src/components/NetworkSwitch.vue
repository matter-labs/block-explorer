<template>
  <Listbox as="div" :model-value="selected" class="network-switch">
    <ListboxButton class="toggle-button">
      <span class="network-item">
        <img :src="currentNetwork.icon" alt="zkSync arrows logo" class="network-item-img" />
        <span class="network-item-label">{{ currentNetwork.l2NetworkName }}</span>
      </span>
      <span class="toggle-button-icon-wrapper">
        <ChevronDownIcon class="toggle-button-icon" aria-hidden="true" />
      </span>
    </ListboxButton>
    <div class="network-list-wrapper">
      <ListboxOptions class="network-list">
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
              <span class="network-item">
                <img :src="network.icon" :alt="`${network.l2NetworkName} logo`" class="network-item-img" />
                <span class="network-item-label network-list-item-label">{{ network.l2NetworkName }} </span>
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
import { ChevronDownIcon } from "@heroicons/vue/solid";

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
  @apply relative;

  .network-list-wrapper {
    @apply absolute right-0 top-full h-auto w-full lg:w-[260px];
  }
  .network-list {
    @apply absolute right-0 top-1 z-10 mb-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm;
  }

  .network-list-item-container {
    @apply flex items-center gap-2 px-3 py-2 text-neutral-900 lg:py-1;
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

    .network-list-item {
      @apply w-full font-sans text-base font-normal text-neutral-700 no-underline;
      &:not(.selected) {
        cursor: pointer;
      }
    }
  }

  .toggle-button {
    @apply relative flex w-full min-w-[125px] items-center rounded-md border border-neutral-300 bg-white px-2 py-2 font-sans text-base text-neutral-700 hover:cursor-pointer focus:border-white active:bg-white active:text-gray-600 lg:border-gray-700 hover:shadow lg:bg-black lg:text-white;
  }
  .network-item {
    @apply mr-4 flex items-center gap-1;
    .network-item-img {
      @apply h-4 w-4 flex-shrink-0;
    }
    .network-item-label {
      @apply block truncate;
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
