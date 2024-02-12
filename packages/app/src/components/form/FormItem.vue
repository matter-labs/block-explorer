<template>
  <component :is="tag" class="form-item">
    <component v-if="label" :is="labelTag" :for="id" class="form-item-label">
      {{ label }}
    </component>
    <slot />
    <div v-if="$slots.underline" class="form-item-underline">
      <slot name="underline" />
    </div>
  </component>
</template>

<script lang="ts" setup>
defineProps({
  tag: {
    type: String,
    default: "div",
  },
  id: {
    type: String,
  },
  label: {
    type: String,
  },
  labelTag: {
    type: String,
    default: "label",
  },
});
</script>

<style lang="scss" scoped>
.form-item {
  @apply w-full;

  .form-item-label {
    @apply mb-1 block font-medium leading-snug;
  }
  .form-item-underline {
    @apply mt-1 text-sm text-neutral-400;
  }
}
.label-inline-block {
  .form-item-label {
    @apply float-left;
  }
}
</style>
