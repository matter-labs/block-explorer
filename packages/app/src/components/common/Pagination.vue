<template>
  <div class="pagination-container">
    <div class="page-size-container">
      <Dropdown
        class="page-size-dropdown"
        v-model="computedPageSize"
        :options="pageSizeOptions"
        :show-above="true"
        :pending="disabled"
      />
      <span class="page-size-text">{{ t("pagination.records") }}</span>
    </div>

    <nav class="page-numbers-container" :class="{ disabled }" aria-label="Pagination">
      <PaginationButton
        :use-route="useQuery"
        :to="{ query: backButtonQuery, hash: currentHash }"
        class="pagination-page-button arrow left"
        :aria-disabled="isFirstPage"
        :class="{ disabled: isFirstPage }"
        @click="currentPage = Math.max(currentPage - 1, 1)"
      >
        <span class="sr-only">Previous</span>
        <ChevronLeftIcon class="chevron-icon" aria-hidden="true" />
      </PaginationButton>
      <template v-for="(item, index) in pagesData" :key="index">
        <PaginationButton
          v-if="item.type === 'page'"
          :use-route="useQuery"
          :to="{
            query: item.number > 1 ? { page: item.number, pageSize: computedPageSize } : { pageSize: computedPageSize },
            hash: currentHash,
          }"
          :aria-current="activePage === item.number ? 'page' : 'false'"
          :class="[{ active: activePage === item.number }, item.hiddenOnMobile ? 'hidden sm:flex' : 'flex']"
          class="pagination-page-button page"
          @click="currentPage = item.number"
        >
          {{ item.number }}
        </PaginationButton>
        <span v-else class="pagination-page-button dots">...</span>
      </template>

      <PaginationButton
        :use-route="useQuery"
        :to="{ query: nextButtonQuery, hash: currentHash }"
        class="pagination-page-button arrow right"
        :aria-disabled="isLastPage"
        :class="{ disabled: isLastPage }"
        @click="currentPage = Math.min(currentPage + 1, pageCount)"
      >
        <span class="sr-only">Next</span>
        <ChevronRightIcon class="chevron-icon" aria-hidden="true" />
      </PaginationButton>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, type UnwrapNestedRefs } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/outline";
import { useOffsetPagination, type UseOffsetPaginationReturn } from "@vueuse/core";

import Dropdown from "@/components/common/Dropdown.vue";
import PaginationButton from "@/components/common/PaginationButton.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const currentHash = computed(() => route?.hash);

const pageSizeOptions = ["10", "20", "50", "100"];
const computedPageSize = computed({
  get() {
    return currentPageSize.value.toString();
  },
  set(newValue) {
    const parsedValue = parseInt(newValue, 10);
    if (parsedValue !== currentPageSize.value) {
      currentPageSize.value = parsedValue;

      router.push({
        query: {
          page: currentPage.value,
          pageSize: parsedValue,
        },
        hash: currentHash.value,
      });
    }
  },
});

const props = defineProps({
  activePage: {
    type: Number,
    default: 1,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  useQuery: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (eventName: "update:activePage", value: number): void;
  (eventName: "update:pageSize", value: number): void;
  (eventName: "onPageChange", value: UnwrapNestedRefs<UseOffsetPaginationReturn>): void;
  (eventName: "onPageSizeChange", value: UnwrapNestedRefs<UseOffsetPaginationReturn>): void;
}>();

const { currentPage, currentPageSize, pageCount, isFirstPage, isLastPage } = useOffsetPagination({
  total: computed(() => props.totalItems),
  page: computed({
    get: () => props.activePage,
    set: (val) => emit("update:activePage", val),
  }),
  pageSize: computed({
    get: () => props.pageSize,
    set: (val) => emit("update:pageSize", val),
  }),
  onPageChange: (data) => emit("onPageChange", data),
  onPageSizeChange: (data) => emit("onPageSizeChange", data),
});

const pagesData = computed(() => {
  type PageItem = { type: "page"; number: number; hiddenOnMobile?: true } | { type: "dots" };
  const pages: PageItem[] = Array.from({ length: pageCount.value }, (_, i) => ({ type: "page", number: i + 1 }));
  const dots: PageItem = { type: "dots" };
  if (pages.length <= 5) {
    return pages;
  }
  let first: PageItem[] = [];
  let middle: PageItem[] = [];
  let last: PageItem[] = [];
  if (currentPage.value <= 2) {
    first.push(pages[0], pages[1], pages[2]);
    middle.push(dots);
    last.push(pages[pages.length - 1]);
  } else if (currentPage.value >= pageCount.value - 1) {
    first.push(pages[0]);
    middle.push(dots);
    last.push(pages[pages.length - 3], pages[pages.length - 2], pages[pages.length - 1]);
  } else {
    first.push(pages[0], dots);
    middle.push({ ...pages[currentPage.value - 2], hiddenOnMobile: true } as PageItem, pages[currentPage.value - 1], {
      ...pages[currentPage.value],
      hiddenOnMobile: true,
    } as PageItem);
    last.push(dots, pages[pages.length - 1]);
  }
  return [...first, ...middle, ...last];
});

const backButtonQuery = computed(() =>
  currentPage.value > 2
    ? { page: currentPage.value - 1, pageSize: computedPageSize.value }
    : { pageSize: computedPageSize.value }
);
const nextButtonQuery = computed(() => ({
  page: Math.min(currentPage.value + 1, pageCount.value),
  pageSize: computedPageSize.value,
}));
</script>

<style lang="scss">
.pagination-container {
  @apply relative flex flex-col-reverse items-center justify-center sm:flex-row;
  .page-numbers-container {
    @apply flex justify-center space-x-1 p-3 transition-opacity;
    &.disabled {
      @apply pointer-events-none opacity-50;
    }

    .pagination-page-button {
      @apply rounded-md bg-white px-1.5 py-1 font-mono text-sm font-medium text-neutral-700 no-underline sm:px-2;
      &:not(.disabled):not(.active):not(.dots) {
        @apply hover:bg-neutral-50;
      }
      &.disabled {
        @apply cursor-not-allowed text-neutral-400;
      }
      &.active {
        @apply z-10 bg-neutral-100;
      }
      &.dots {
        @apply font-sans text-neutral-400 hover:bg-white;
      }
      &.arrow {
        @apply flex items-center;

        .chevron-icon {
          @apply h-4 w-4;
        }
      }
    }
  }
  .page-size-container {
    @apply relative left-0 flex items-center justify-center pb-2 sm:absolute sm:left-6 sm:pb-0;
    .page-size-text {
      @apply pl-2 text-gray-500;
    }
    .page-size-dropdown {
      @apply w-16;
      .toggle-button {
        @apply h-8 px-2 py-0 leading-8;
      }
    }
  }
}
</style>
