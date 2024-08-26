<template>
  <div>
    <div class="head-token flex flex-col-reverse justify-between mb-8 lg:flex-row lg:mb-10">
      <Breadcrumbs :items="breadcrumbItems" />
      <SearchForm class="search-form w-[576px] max-w-full max-lg:mb-8" />
    </div>
    <div class="tokens-header flex gap-4 items-end justify-between">
      <h1 class="font-semibold">{{ t("tokensView.heading") }}</h1>
      <div v-if="tokens[0]?.iconURL" class="coingecko-attribution mr-1 text-gray">
        <span>{{ t("tokensView.offChainDataPoweredBy") }}{{ " " }}</span>
        <a class="text-blue" href="https://www.coingecko.com/en/api" target="_blank">CoinGecko API</a>
      </div>
    </div>
    <div class="tokens-container mt-8">
      <span v-if="isTokensFailed" class="error-message">
        {{ t("failedRequest") }}
      </span>
      <TokenTable :tokens="tokens" :loading="isTokensPending"></TokenTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import SearchForm from "@/components/SearchForm.vue";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";
import TokenTable from "@/components/token/TokenListTable.vue";

import useTokenLibrary from "@/composables/useTokenLibrary";

const { tokens, isRequestPending: isTokensPending, isRequestFailed: isTokensFailed, getTokens } = useTokenLibrary();

const { t } = useI18n();
const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    text: t("breadcrumbs.home"),
    to: { name: "home" },
  },
  {
    text: `${t("tokensView.title")}`,
  },
]);

getTokens();
</script>
