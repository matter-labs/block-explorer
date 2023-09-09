<template>
  <div class="card">
    <div>
      <div class="title">{{ t("networkStats.title") }}</div>
      <div class="subtitle">{{ subtitle }}</div>
    </div>
    <dl class="description-list">
      <div class="stats-container">
        <dt>
          <router-link :to="{ name: 'blocks' }">{{ t("networkStats.committed") }}</router-link>
        </dt>
        <dd>
          <ContentLoader v-if="loading" class="h-full w-24" />
          <span v-else>{{ formatWithSpaces(committed ?? 0) }}</span>
        </dd>
      </div>
      <div class="stats-container">
        <dt>
          <router-link :to="{ name: 'blocks' }">{{ t("networkStats.verified") }}</router-link>
        </dt>
        <dd>
          <ContentLoader v-if="loading" class="h-full w-24" />
          <span v-else>{{ formatWithSpaces(verified ?? 0) }}</span>
        </dd>
      </div>
      <div class="stats-container">
        <dt>
          <router-link :to="{ name: 'transactions' }">{{ t("networkStats.transactions") }}</router-link>
        </dt>
        <dd>
          <ContentLoader v-if="loading" class="h-full w-36" />
          <span v-else>{{ formatWithSpaces(transactions ?? 0) }}</span>
        </dd>
      </div>
      <div v-if="totalLocked" class="stats-container">
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
  currentNetwork.value.name === "mainnet" ? t("networkStats.subtitleMainnet") : t("networkStats.subtitleTestnet")
);
</script>

<style scoped lang="scss">
.card {
  @apply flex w-full flex-col justify-between gap-x-12 rounded-lg bg-white px-8 py-5 shadow lg:flex-row lg:items-center;
  .title {
    @apply text-xl font-bold text-neutral-700;
  }
  .subtitle {
    @apply font-sans text-base text-neutral-400;
  }
  .stats-container {
    @apply flex flex-col border-neutral-200 py-3 pr-8 text-xl text-neutral-500 last:border-0 last:pb-0 sm:border-r sm:py-0 lg:w-max;
    dd {
      @apply text-[1.65rem] font-bold text-primary-800 xl:text-3xl;
    }
    a {
      @apply text-inherit no-underline;
    }
  }
  .description-list {
    @apply mt-4 gap-x-8 divide-y sm:flex sm:divide-y-0 lg:mt-0 lg:justify-end;
  }
}
</style>
