<template>
  <td class="table-body-col">
    <slot></slot>
  </td>
</template>

<script setup lang="ts"></script>

<style lang="scss">
.table-body-col {
  @apply whitespace-nowrap px-4 py-4 text-sm text-silver-500 first:font-medium first:text-silver-500 md:px-2 md:first:pl-6 md:last:pr-6;

  a {
    @apply hover:text-cream;
  }
}
</style>
