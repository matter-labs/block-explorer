<template>
  <Listbox as="div" :model-value="selected" class="network-switch">
    <ListboxButton class="toggle-button">
      <span class="network-item">
        <img :src="currentNetwork.icon" alt="ZKsync arrows logo" class="network-item-img" />
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
    @apply absolute right-0 top-1 z-10 mb-1 max-h-56 w-full overflow-auto rounded-md bg-night-1000 py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm;
  }

  .network-list-item-container {
    @apply flex items-center gap-2 px-3 py-2 text-cream lg:py-1;
    &:not(.selected) {
      cursor: pointer;
    }
    &.selected {
      @apply bg-night-700;
    }
    &:not(.selected).active,
    &:not(.selected):hover {
      @apply bg-night-800;
    }

    .network-list-item {
      @apply w-full font-sans text-base font-normal text-cream no-underline;
      &:not(.selected) {
        cursor: pointer;
      }
    }
  }

  .toggle-button {
    @apply relative flex w-full min-w-[125px] items-center rounded-md border border-night-800 bg-night-1000 px-2 py-2 font-sans text-base text-silver-500 hover:cursor-pointer focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 lg:border-primary-800 lg:bg-primary-800 lg:text-white;
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
      @apply h-5 w-5 text-silver-500 lg:text-white;
    }
  }
}
</style>
