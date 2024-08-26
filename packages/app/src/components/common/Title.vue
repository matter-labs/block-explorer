<template>
  <h1
    class="title-container flex flex-wrap break-all text-3xl font-semibold sm:text-4xl"
    :data-testid="$testId.pageTitle"
  >
    {{ title }}&nbsp;
    <div v-if="value" class="title-block flex items-center gap-4 font-semibold">
      <slot>{{ shortValue(value) }}</slot>
      <CopyButton :value="value" class="title-copy-button" />
    </div>
  </h1>
</template>
<script lang="ts" setup>
import CopyButton from "@/components/common/CopyButton.vue";

import { shortValue } from "@/utils/formatters";

defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: String,
  },
});
</script>

<style lang="scss">
.title-copy-button {
  .copy-button {
    @apply top-0.5 flex text-inherit hover:text-neutral-400 sm:top-0.5;

    .copy-button-icon {
      @apply h-6 w-6 sm:h-7 sm:w-7;
    }
  }
}
</style>
