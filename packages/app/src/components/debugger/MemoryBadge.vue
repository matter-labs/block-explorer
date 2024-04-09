<template>
  <div class="badge-container" :class="[`color-${setBadgeColor(memoryDirection, defaultColor)}`]">
    <div class="badge-content">
      {{ text }}
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  text: {
    type: String,
    default: "",
  },
  memoryDirection: {
    type: String,
    default: "",
  },
  defaultColor: {
    type: String,
    default: "neutral",
  },
});

function setBadgeColor(item: string, defaultColor: string) {
  return (item === "Write" && "warning") || (item === "Read" && "primary") || defaultColor;
}
</script>

<style scoped lang="scss">
.badge-container {
  @apply flex w-full max-w-max items-center rounded px-2 py-1 pr-2.5 font-bold capitalize;

  .badge-content {
    @apply block break-all;
  }
  &.color-primary {
    @apply bg-primary-400 text-white;

    .badge-dot {
      @apply bg-primary-500;
    }
  }
  &.color-neutral {
    @apply bg-neutral-200 text-neutral-600;

    .badge-dot {
      @apply bg-neutral-600;
    }
  }
  &.color-warning {
    @apply bg-warning-400 text-white;

    .badge-dot {
      @apply bg-warning-600;
    }
  }
  &.color-transparent {
    @apply pl-0 text-neutral-600;

    .badge-dot {
      @apply text-neutral-600;
    }
  }
}
</style>
