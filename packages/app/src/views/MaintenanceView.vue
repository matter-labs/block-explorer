<template>
  <div class="maintenance-container">
    <div class="maintenance">
      <Spinner size="lg" color="primary" outline />
      <h1 class="title">{{ t("maintenance.title", { network: currentNetwork.l2NetworkName }) }}</h1>
      <i18n-t class="description" scope="global" keypath="maintenance.description" tag="p">
        <template #network>
          {{ currentNetwork.l2NetworkName }}
        </template>
        <template #twitter>
          <a href="https://twitter.com/Treasure_DAO" target="_blank">{{ t("maintenance.twitterLink") }}</a>
        </template>
        <template #uptime>
          <a href="https://uptime.com/statuspage/era" target="_blank">{{ t("maintenance.uptimeLink") }}</a>
        </template>
      </i18n-t>
      <div class="flex gap-2">
        <Button class="twitter-button" tag="a" href="https://twitter.com/Treasure_DAO" target="_blank">
          {{ t("maintenance.twitterButton") }}
        </Button>
        <Button class="uptime-button" tag="a" href="https://uptime.com/statuspage/era" target="_blank">
          {{ t("maintenance.uptimeLink") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import Button from "@/components/common/Button.vue";
import Spinner from "@/components/common/Spinner.vue";

import useContext from "@/composables/useContext";

const { t } = useI18n();
const { currentNetwork } = useContext();
</script>

<style lang="scss" scoped>
.maintenance-container {
  @apply flex min-h-[calc(100vh-260px)] items-center justify-center;
  .maintenance {
    @apply grid h-max w-max max-w-[29rem] grid-flow-row justify-items-center gap-4 rounded-lg bg-night-1000 p-4 text-center shadow-md;

    .title {
      @apply mt-1 text-2xl text-cream;
    }
    .description {
      @apply text-silver-500;
    }
    .twitter-button {
      @apply w-max no-underline bg-ruby-600 hover:bg-ruby-700;
    }
    .uptime-button {
      @apply w-max no-underline bg-transparent border-night-100 hover:bg-night-400;
    }
  }
}
</style>
