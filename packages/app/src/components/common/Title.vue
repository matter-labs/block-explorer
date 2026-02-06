<template>
  <h1 class="title-container" :data-testid="$testId.pageTitle">
    {{ title }}&nbsp;
    <div v-if="value" class="title-block">
      <slot>{{ shortValue(value) }}</slot>
      <CopyButton :value="value" class="title-copy-button" />
    </div>
    <div class="badge-container">
      <Badge v-if="isVerified" color="dark-success" class="verified-badge" :tooltip="t('contract.verifiedTooltip')">
        {{ t("contract.verified") }}
      </Badge>
      <Badge v-if="isEvmLike" color="primary" class="verified-badge" :tooltip="t('contract.evmTooltip')">
        {{ t("contract.evm") }}
      </Badge>
    </div>
  </h1>
</template>
<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import Badge from "./Badge.vue";

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
  isVerified: {
    type: Boolean,
  },
  isEvmLike: {
    type: Boolean,
    default: false,
    required: false,
  },
});

const { t } = useI18n();
</script>
<style lang="scss">
.title-container {
  @apply flex flex-wrap items-end break-all text-3xl sm:text-4xl;
  .title-block {
    @apply flex gap-4 self-center font-bold;
    .title-copy-button {
      .copy-button {
        @apply top-0.5 flex text-inherit hover:text-neutral-400 sm:top-0.5;
        .copy-button-icon {
          @apply h-6 w-6 sm:h-7 sm:w-7;
        }
      }
    }
  }
  .badge-container {
    @apply mb-1 ml-2 flex flex-wrap items-end gap-0 break-all;
  }
}
</style>
