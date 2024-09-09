<template>
  <ul class="breadcrumbs flex flex-wrap items-center">
    <template v-for="(item, index) in items" :key="index">
      <li class="breadcrumb-item font-medium">
        <router-link
          v-if="item.to"
          class="breadcrumb-item-link text-sm leading-tight text-black hover:text-gray"
          :to="item.to"
          >{{ item.text }}</router-link
        >
        <span v-else class="breadcrumb-item-active text-sm leading-tight text-black">{{ item.text }}</span>
      </li>
      <li
        class="breadcrumb-divider mx-5 h-2 w-2 rotate-45 border-r border-t border-gray"
        aria-hidden="true"
        v-if="index < items.length - 1"
      ></li>
    </template>
  </ul>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { RouteLocationRaw } from "vue-router";

export interface BreadcrumbItem {
  text: string;
  to?: RouteLocationRaw;
}

defineProps({
  items: {
    type: Array as PropType<BreadcrumbItem[]>,
    default: () => [],
    required: true,
  },
});
</script>
