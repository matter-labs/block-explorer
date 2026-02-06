<template>
  <div class="token-icon-label">
    <AddressLink :address="address" :is-token-address="true" class="token-link" :data-testid="$testId?.tokensIcon">
      <span v-if="showLinkSymbol" class="token-symbol">
        <span v-if="symbol">
          {{ symbol }}
        </span>
        <span class="unknown-token-symbol" v-else>{{ t("balances.table.unknownSymbol") }}</span>
      </span>
      <div class="token-icon-container" :class="iconSize">
        <div class="token-img-loader"></div>
        <img
          class="token-img"
          :class="{ loaded: isImageLoaded }"
          :src="imgSource"
          :alt="symbol || t('balances.table.unknownSymbol')"
        />
      </div>
    </AddressLink>
    <div class="token-info-container">
      <div class="token-info" v-if="name && symbol">
        <div class="token-symbol">
          {{ symbol }}
        </div>
        <div class="token-name">
          {{ name }}
        </div>
        <div class="token-badge">
          <Badge
            v-if="bridged"
            color="primary"
            class="verified-badge"
            :tooltip="t('tokensView.table.bridged.tooltip', { brandName })"
          >
            {{ t("tokensView.table.bridged.title") }}
          </Badge>
          <Badge
            v-else
            color="progress"
            class="verified-badge"
            :tooltip="t('tokensView.table.native.tooltip', { brandName })"
          >
            {{ t("tokensView.table.native.title") }}
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, type PropType } from "vue";
import { useI18n } from "vue-i18n";

import { useImage } from "@vueuse/core";

import AddressLink from "@/components/AddressLink.vue";
import Badge from "@/components/common/Badge.vue";

import useRuntimeConfig from "@/composables/useRuntimeConfig";

import type { Hash } from "@/types";

export type IconSize = "sm" | "md" | "lg" | "xl";

const { t } = useI18n();
const { brandName } = useRuntimeConfig();

const props = defineProps({
  address: {
    type: String as PropType<Hash>,
    required: true,
  },
  symbol: {
    type: [String, null] as PropType<string | null>,
    default: null,
  },
  iconSize: {
    type: String as PropType<IconSize>,
    default: "sm",
  },
  iconUrl: {
    type: [String, null] as PropType<string | null>,
    default: "",
  },
  showLinkSymbol: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: "",
  },
  bridged: {
    type: Boolean,
    default: false,
  },
});

const imgSource = computed(() => {
  return props.iconUrl || "/images/currencies/customToken.svg";
});
const { isReady: isImageLoaded } = useImage({ src: imgSource.value });
</script>

<style lang="scss">
.token-icon-label {
  @apply flex items-center gap-x-2 text-sm;

  .token-link {
    @apply flex items-center gap-x-1;

    .unknown-token-symbol {
      @apply italic;
    }

    .token-icon-container {
      @apply relative overflow-hidden rounded-full;
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

      .token-img-loader,
      .token-img {
        @apply absolute inset-0 h-full w-full rounded-full;
      }
      .token-img-loader {
        @apply animate-pulse bg-neutral-200;
      }
      .token-img {
        @apply opacity-0 transition-opacity duration-150;
        &.loaded {
          @apply opacity-100;
        }
      }
    }
  }
  .token-info-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }
  .token-info {
    .token-symbol {
      @apply text-neutral-600;
    }
    .token-name {
      @apply text-xs text-neutral-400;
    }
    .token-badge {
      @apply flex items-center justify-end gap-x-1 md:justify-start;
    }
  }
}
</style>
