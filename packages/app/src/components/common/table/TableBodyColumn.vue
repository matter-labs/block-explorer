<template>
  <td class="table-body-col">
    <slot></slot>
  </td>
</template>

<script setup lang="ts"></script>

<style lang="scss">
.table-body-col {
  @apply whitespace-nowrap py-2 px-4 text-sm text-gray-600 first:font-medium first:text-gray-900 md:px-2 md:first:pl-6 md:last:pr-6;
}
</style>
