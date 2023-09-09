<template>
  <div class="info-field-copy-content">
    <HashLabel :text="value">
      <ExternalLinkIcon v-if="isExternalLink" />
    </HashLabel>
    <CopyButton :value="value" />
  </div>
</template>

<script lang="ts" setup>
import { ExternalLinkIcon } from "@heroicons/vue/solid";

import CopyButton from "@/components/common/CopyButton.vue";
import HashLabel from "@/components/common/HashLabel.vue";

defineProps({
  value: {
    type: String,
    default: "",
    required: true,
  },
  isExternalLink: {
    type: Boolean,
    default: false,
  },
});
</script>

<style lang="scss">
.info-field-copy-content {
  @apply -my-1 grid w-full min-w-[6rem] grid-cols-9 items-center justify-items-end;
}
</style>
