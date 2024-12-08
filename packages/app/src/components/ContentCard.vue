<template>
  <component :is="tag" class="content-container">
    <slot />
  </component>
</template>

<script lang="ts" setup>
defineProps({
  tag: {
    type: String,
    default: "div",
  },
});
</script>

<style lang="scss">
.content-container {
  @apply mt-4 grid w-full grid-flow-row grid-cols-1 gap-4 rounded-lg bg-night-1000 p-4 shadow-md;

  .content-title {
    @apply text-2xl text-silver-500;
  }
}
</style>
