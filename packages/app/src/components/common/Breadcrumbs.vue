<template>
  <ul class="breadcrumbs">
    <template v-for="(item, index) in items" :key="index">
      <li class="breadcrumb-item">
        <router-link v-if="item.to" class="breadcrumb-item-link" :to="item.to">{{ item.text }}</router-link>
        <span v-else class="breadcrumb-item-active">{{ item.text }}</span>
      </li>
      <li class="breadcrumb-divider" aria-hidden="true" v-if="index < items.length - 1"></li>
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

<style lang="scss">
.breadcrumbs {
  @apply flex flex-wrap items-center;

  .breadcrumb-item {
    .breadcrumb-item-link,
    .breadcrumb-item-active {
      @apply text-sm leading-tight text-gray-200;
    }
    .breadcrumb-item-link {
      @apply no-underline hover:underline;
    }
  }
  .breadcrumb-divider {
    @apply mx-5 h-2 w-2 rotate-45 border-r border-t border-gray-300;
  }
}
</style>
