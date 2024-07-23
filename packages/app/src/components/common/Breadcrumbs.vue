<template>
  <ul class="breadcrumbs flex flex-wrap items-center">
    <template v-for="(item, index) in items" :key="index">
      <li class="breadcrumb-item font-medium">
        <router-link
          v-if="item.to"
          class="breadcrumb-item-link leading-tight text-black text-sm hover:text-gray"
          :to="item.to"
          >{{ item.text }}</router-link
        >
        <span v-else class="breadcrumb-item-active leading-tight text-black text-sm">{{ item.text }}</span>
      </li>
      <li
        class="breadcrumb-divider border-gray border-r border-t h-2 mx-5 rotate-45 w-2"
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

<!-- <style lang="scss">
</style> -->
