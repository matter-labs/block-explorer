<template>
  <div>
    <div class="head-block">
      <Breadcrumbs :items="breadcrumbItems" />
      <SearchForm class="search-form" />
    </div>
    <h1>{{ t("blocksView.title") }}</h1>
    <div class="blocks-container">
      <span v-if="failed" class="error-message">
        {{ t("failedRequest") }}
      </span>
      <TableBlocks
        v-else
        class="blocks-table"
        :data-testid="$testId.blocksTable"
        :loading="pending"
        :loading-rows="pageSize"
        :blocks="data ?? []"
      >
        <template v-if="page && total && total > pageSize" #footer>
          <div class="flex justify-center p-3">
            <Pagination :active-page="page!" :total-items="total!" :page-size="pageSize" :disabled="pending" />
          </div>
        </template>
      </TableBlocks>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import SearchForm from "@/components/SearchForm.vue";
import TableBlocks from "@/components/blocks/Table.vue";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";
import Pagination from "@/components/common/Pagination.vue";

import useBlocks from "@/composables/useBlocks";
import useContext from "@/composables/useContext";

const { t } = useI18n();

const context = useContext();
const route = useRoute();

const { load, pending, failed, page, pageSize, data, total } = useBlocks(context);

const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    text: t("breadcrumbs.home"),
    to: { name: "home" },
  },
  {
    text: `${t("blocksView.title")}`,
  },
]);

watch(
  () => route.query.page,
  (page) => {
    const currentPage = page ? parseInt(page as string) : 1;
    load(currentPage, currentPage === 1 ? new Date() : undefined);
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.head-block {
  @apply mb-8 flex flex-col-reverse justify-between lg:mb-10 lg:flex-row;

  .search-form {
    @apply mb-6 w-full max-w-[26rem] lg:mb-0;
  }
}
.blocks-container {
  @apply mt-8;
}
</style>
