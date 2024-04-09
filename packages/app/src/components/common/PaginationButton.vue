<template>
  <component :is="useRoute ? 'router-link' : 'button'">
    <slot />
  </component>
</template>

<script setup lang="ts">
defineProps({
  useRoute: {
    type: Boolean,
    required: true,
  },
});
</script>
