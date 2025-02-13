<template>
  <AddressLink :address="tokenAddress">
    <div class="nft-container">
      <div class="nft-icon-container" :class="iconSize">
        <div class="nft-img-loader"></div>
        <img
          class="nft-img"
          :class="{ loaded: isImageLoaded }"
          :src="url"
          :alt="symbol || t('balances.table.unknownSymbol')"
        />
      </div>
      <div>
        <div v-if="name" class="nft-name">
          {{ name }}
        </div>
        <div v-else class="nft-name">{{ symbol }} #{{ tokenId }}</div>
      </div>
    </div>
  </AddressLink>
</template>
<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import { useImage } from "@vueuse/core";

import AddressLink from "@/components/AddressLink.vue";

import type { PropType } from "vue";
const { t } = useI18n();

const props = defineProps({
  tokenAddress: {
    type: String as PropType<string>,
    required: false,
  },
  url: {
    type: String as PropType<string>,
    default: "",
    required: false,
  },
  symbol: {
    type: String as PropType<string | undefined | null>,
    default: "",
    required: false,
  },
  tokenId: {
    type: String as PropType<string | undefined | null>,
    default: "",
    required: false,
  },
  name: {
    type: String as PropType<string>,
    default: "",
    required: false,
  },
  iconSize: {
    type: String as PropType<"sm" | "md" | "lg" | "xl">,
    default: "xl",
    required: false,
  },
});

const { isReady: isImageLoaded } = useImage({ src: props.url });
</script>

<style lang="scss" scoped>
.nft-container {
  @apply flex items-center gap-x-1;
}

.nft-name {
  @apply ml-0 text-xs text-gray-400;
}
.nft-icon-container {
  @apply relative overflow-hidden flex items-center justify-center;
  &.sm {
    @apply h-4 w-4;
  }
  &.md {
    @apply h-5 w-5;
  }
  &.lg {
    @apply h-6 w-6;
  }
  &.xl {
    @apply h-8 w-8;
  }
  &.xs {
    @apply h-3 w-3;
  }

  .nft-img-loader,
  .nft-img {
    @apply absolute inset-0 h-full w-full;
  }
  .nft-img-loader {
    @apply animate-pulse bg-neutral-200;
  }
  .nft-img {
    @apply opacity-0 transition-opacity duration-150;
    &.loaded {
      @apply opacity-100;
    }
  }
}
</style>
