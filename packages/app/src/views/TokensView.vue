<template>
  <div>
    <div class="head-token">
      <Breadcrumbs :items="breadcrumbItems" />
      <SearchForm class="search-form" />
    </div>
    <h1>{{ t("tokenListView.heading") }}</h1>
    <div class="tokens-container">
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
    text: `${t("tokenListView.title")}`,
  },
]);

getTokens();
</script>

<style scoped lang="scss">
.head-token {
  @apply mb-8 flex flex-col-reverse justify-between lg:mb-10 lg:flex-row;

  .search-form {
    @apply mb-6 w-full max-w-[26rem] lg:mb-0;
  }
}
.tokens-container {
  @apply mt-8;
}
</style>
