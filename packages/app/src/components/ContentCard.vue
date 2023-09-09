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
  @apply mt-4 grid w-full grid-flow-row grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow-md;

  .content-title {
    @apply text-2xl text-neutral-700;
  }
}
</style>
