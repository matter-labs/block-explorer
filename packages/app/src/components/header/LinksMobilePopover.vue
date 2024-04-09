<template>
  <PopoverButton v-for="item in items" :key="item.to?.name ?? item.url">
    <router-link v-if="item.to" :to="item.to" class="mobile-navigation-link internal-link">
      <span class="mobile-navigation-label">
        {{ item.label }}
      </span>
    </router-link>
    <a v-else :href="item.url" target="_blank" class="mobile-navigation-link internal-link">
      <span class="mobile-navigation-label">
        {{ item.label }}
      </span>
    </a>
  </PopoverButton>
</template>

<script lang="ts" setup>
import { PopoverButton } from "@headlessui/vue";

import type { PropType } from "vue";

type InternalNavigation = {
  label: string;
  to?: { name: string };
  url?: string;
};
defineProps({
  items: {
    type: Array as PropType<InternalNavigation[]>,
    default: () => [],
    required: true,
  },
});
</script>
