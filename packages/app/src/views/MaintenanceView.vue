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
          <a href="https://twitter.com/zulu_network" target="_blank">{{ t("maintenance.twitterLink") }}</a>
        </template>
        <template #uptime>
          <a href="https://uptime.com/s/zkSync-testnet" target="_blank">{{ t("maintenance.uptimeLink") }}</a>
        </template>
      </i18n-t>
      <Button class="twitter-button" tag="a" href="https://twitter.com/zulu_network" target="_blank">
        {{ t("maintenance.twitterButton") }}
      </Button>
      <a class="uptime-link" href="https://uptime.com/s/zkSync-testnet" target="_blank">
        {{ t("maintenance.uptimeLink") }}
      </a>
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
    @apply grid h-max w-max max-w-[29rem] grid-flow-row justify-items-center gap-4 rounded-lg bg-white p-4 text-center shadow-md;

    .title {
      @apply mt-1 text-2xl text-neutral-700;
    }
    .description {
      @apply text-neutral-600;
    }
    .twitter-button {
      @apply w-max no-underline;
    }
    .uptime-link {
      @apply text-neutral-600;
    }
  }
}
</style>
