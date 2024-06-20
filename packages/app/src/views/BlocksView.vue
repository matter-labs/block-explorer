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
        <template v-if="activePage && total && total > DEFAULT_PAGE_SIZE" #table-head>
          <div class="flex justify-center p-3">
            <Pagination
              v-model:active-page="activePage"
              :total-items="total!"
              v-model:page-size="pageSize"
              :disabled="pending"
              :header="true"
            />
          </div>
        </template>
        <template v-if="activePage && total && total > DEFAULT_PAGE_SIZE" #footer>
          <div class="flex justify-center p-3">
            <Pagination
              v-model:active-page="activePage"
              :total-items="total!"
              v-model:page-size="pageSize"
              :disabled="pending"
              :header="false"
            />
          </div>
        </template>
      </TableBlocks>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import SearchForm from "@/components/SearchForm.vue";
import TableBlocks from "@/components/blocks/Table.vue";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/common/Breadcrumbs.vue";
import Pagination from "@/components/common/Pagination.vue";

import useBlocks from "@/composables/useBlocks";
import useContext from "@/composables/useContext";

import { DEFAULT_PAGE_SIZE } from "@/utils/constants";

const { t } = useI18n();

const context = useContext();
const route = useRoute();

const { load, pending, failed, data, total } = useBlocks(context);

const breadcrumbItems = computed((): BreadcrumbItem[] => [
  {
    text: t("breadcrumbs.home"),
    to: { name: "home" },
  },
  {
    text: `${t("blocksView.title")}`,
  },
]);

const activePage = ref(route.query.page ? parseInt(route.query.page as string) : 1);
const pageSize = ref(route.query.pageSize ? parseInt(route.query.pageSize as string) : DEFAULT_PAGE_SIZE);

watch(
  [activePage, pageSize],
  ([page, size]) => {
    const currentPage = page ?? 1;
    const pageSize = size ?? DEFAULT_PAGE_SIZE;
    load(currentPage, pageSize, currentPage === 1 ? new Date() : undefined);
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
