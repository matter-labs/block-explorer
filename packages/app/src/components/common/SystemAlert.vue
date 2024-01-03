<template>
  <div class="system-alert">
    <IconError class="icon" color="#FFC81A" />
    <span class="system-alert-body">
      <slot />
    </span>
  </div>
</template>

<script setup lang="ts">
import IconError from "@/components/icons/IconError.vue";
</script>

<style scoped lang="scss">
.system-alert {
  @apply flex items-center text-white rounded-2xl border border-amber-400/50 bg-amber-400/10 mb-6 py-3 px-4;

  .system-alert-body {
    @apply ml-3 w-full;
  }
}
</style>
