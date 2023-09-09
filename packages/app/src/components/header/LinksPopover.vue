<template>
  <Menu class="dropdown-container" as="div" v-slot="{ open }">
    <MenuButton>
      <div class="navigation-link" :class="{ active: open }">
        {{ label }}
        <ChevronDownIcon class="dropdown-icon" aria-hidden="true" />
      </div>
    </MenuButton>
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems class="dropdown-items">
        <MenuItem v-for="item in items" :key="item.to?.name ?? item.url" class="dropdown-item" v-slot="{ active }">
          <router-link v-if="item.to" :to="item.to" :class="{ 'bg-neutral-100': active }">
            {{ item.label }}
          </router-link>
          <a v-else-if="item.url" :href="item.url" target="_blank" :class="{ 'bg-neutral-100': active }">{{
            item.label
          }}</a>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script lang="ts" setup>
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/outline";

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
  label: {
    type: String,
    default: "",
    required: true,
  },
});
</script>
