<template>
  <div class="file-preview-container">
    <span class="index">{{ index + 1 }}</span>
    <span class="name">{{ name }}</span>
    <TrashIcon @click="emit('removeFile')" class="trash-icon" />
  </div>
</template>
<script lang="ts" setup>
import TrashIcon from "@/components/icons/TrashIcon.vue";

const emit = defineEmits<{
  (e: "removeFile"): void;
}>();

defineProps({
  name: {
    type: String,
    requred: true,
  },
  index: {
    type: Number,
    required: true,
  },
});
</script>
<style lang="scss" scoped>
.file-preview-container {
  @apply flex w-full items-center gap-x-2 py-1;
  .name {
    @apply max-w-[calc(100%_-_3rem)] break-all leading-tight text-neutral-600;
  }
  .index {
    @apply text-neutral-400;
  }
  .index {
    @apply self-baseline;
  }
  .trash-icon {
    @apply w-3.5 cursor-pointer transition-colors hover:text-neutral-500;
  }
}
</style>
