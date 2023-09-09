<template>
  <div class="transactions-data-link-network">
    {{ network }}
  </div>
</template>

<script lang="ts" setup>
import type { NetworkOrigin } from "@/types";
import type { PropType } from "vue";

defineProps({
  network: {
    type: String as PropType<NetworkOrigin>,
    required: true,
    default: "L1",
  },
});
</script>

<style scoped lang="scss">
.transactions-data-link-network {
  @apply h-[20px] w-[20px] rounded bg-neutral-200 text-center text-sm text-neutral-800;
}
</style>
