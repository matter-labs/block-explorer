<template>
  <div class="card">
    <div>
      <div class="title">{{ t("networkStats.title") }}</div>
      <div class="subtitle">{{ subtitle }}</div>
    </div>
    <dl class="description-list">
      <div
        class="flex flex-col border-night-1200 py-3 pr-8 text-base text-silver-500 border-r-night-600 last:border-0 last:pb-0 sm:border-r drop-shadow-xl drop-shadow-night-1000 sm:py-0 lg:w-max"
      >
        <dt>
          <router-link :to="{ name: 'blocks' }" class="font-light text-inherit no-underline">{{
            t("networkStats.committed")
          }}</router-link>
        </dt>
        <dd class="text-[1.65rem] font-medium text-cream xl:text-3xl">
          <ContentLoader v-if="loading" class="h-full w-24" />
          <span v-else>{{ formatWithSpaces(committed ?? 0) }}</span>
        </dd>
      </div>
      <div
        class="flex flex-col border-night-1200 py-3 pr-8 text-base text-silver-500 border-r-night-600 last:border-0 last:pb-0 sm:border-r sm:py-0 lg:w-max"
      >
        <dt>
          <router-link :to="{ name: 'blocks' }" class="font-light text-inherit no-underline">{{
            t("networkStats.verified")
          }}</router-link>
        </dt>
        <dd class="text-[1.65rem] font-medium text-cream xl:text-3xl">
          <ContentLoader v-if="loading" class="h-full w-24" />
          <span v-else>{{ formatWithSpaces(verified ?? 0) }}</span>
        </dd>
      </div>
      <div
        class="flex flex-col border-night-1200 py-3 pr-8 text-base text-silver-500 border-r-night-600 last:border-0 last:pb-0 sm:border-r sm:py-0 lg:w-max"
      >
        <dt>
          <router-link :to="{ name: 'transactions' }" class="font-light text-inherit no-underline">{{
            t("networkStats.transactions")
          }}</router-link>
        </dt>
        <dd class="text-[1.65rem] font-medium text-cream xl:text-3xl">
          <ContentLoader v-if="loading" class="h-full w-36" />
          <span v-else>{{ formatWithSpaces(transactions ?? 0) }}</span>
        </dd>
      </div>
      <div
        v-if="totalLocked"
        class="flex flex-col border-night-1200 py-3 pr-8 text-base text-silver-500 border-r-night-600 last:border-0 last:pb-0 sm:border-r sm:py-0 lg:w-max"
      >
        <dt>
          {{ t("networkStats.totalLocked") }}
        </dt>
        <dd>
          <ContentLoader v-if="loading" class="h-full w-20" />
          <span v-else>{{ formatMoney(totalLocked) }}</span>
        </dd>
      </div>
    </dl>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ContentLoader from "@/components/common/loaders/ContentLoader.vue";

import useContext from "@/composables/useContext";

import { formatMoney, formatWithSpaces } from "@/utils/formatters";

const { t } = useI18n();
const { currentNetwork } = useContext();

defineProps({
  loading: {
    type: Boolean,
    default: true,
  },
  committed: {
    type: Number,
  },
  verified: {
    type: Number,
  },
  transactions: {
    type: Number,
  },
  totalLocked: {
    type: Number,
  },
});

const subtitle = computed(() =>
  currentNetwork.value.name === "Treasure" ? t("networkStats.subtitleMainnet") : t("networkStats.subtitleTestnet")
);
</script>

<style scoped lang="scss">
.card {
  @apply flex w-full flex-col justify-between gap-x-12 rounded-lg bg-night-800 border border-night-600 px-8 py-5 lg:flex-row lg:items-center;

  .title {
    @apply text-xl font-semibold text-cream;
  }
  .subtitle {
    @apply font-sans text-base text-silver-500;
  }
  .description-list {
    @apply mt-4 gap-x-8 divide-y sm:flex sm:divide-y-0 lg:mt-0 lg:justify-end;
  }
}
</style>
