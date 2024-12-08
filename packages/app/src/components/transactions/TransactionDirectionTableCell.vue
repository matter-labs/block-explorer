<template>
  <div
    v-if="text"
    class="label-container"
    :class="{ incoming: text === 'in', outcoming: text === 'out', self: text === 'self' }"
  >
    {{ text }}
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
export type Direction = "in" | "out" | "self";

defineProps({
  text: {
    type: String as PropType<Direction>,
    required: true,
  },
});
</script>
<style lang="scss" scoped>
.label-container {
  @apply h-5 w-12 rounded text-center text-xs uppercase leading-5;
}
.incoming {
  @apply bg-[#C7F5D3] text-[#4CA154];
}
.outcoming {
  @apply bg-[#fcf5e5] text-[#E59900];
}
.self {
  @apply bg-sapphire-900 text-sapphire-500;
}
</style>
