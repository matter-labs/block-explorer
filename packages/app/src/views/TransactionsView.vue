<template>
  <div>
    <div class="head-block flex flex-col-reverse justify-between mb-8 lg:flex-row lg:mb-10">
      <Breadcrumbs :items="breadcrumbItems" />
      <SearchForm class="search-form w-[576px] max-w-full max-lg:mb-8" />
    </div>
    <h1 class="font-semibold text-black">{{ t("transactionsView.title") }}</h1>
    <TransactionsTable
      class="transactions-container mt-8"
      use-query-pagination
      :data-testid="$testId.transactionsTable"
    />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import SearchForm from "@/components/SearchForm.vue";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";
import TransactionsTable from "@/components/transactions/Table.vue";

const { t } = useI18n();

const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    text: t("breadcrumbs.home"),
    to: { name: "home" },
  },
  {
    text: `${t("transactionsView.title")}`,
  },
]);
</script>
