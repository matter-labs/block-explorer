<template>
  <nav
    class="pagination-container flex font-medium space-x-1 transition-opacity"
    :class="{ disabled }"
    aria-label="Pagination"
  >
    <PaginationButton
      :use-route="useQuery"
      :to="{ query: backButtonQuery, hash: currentHash }"
      class="pagination-page-button arrow left flex items-center no-underline px-1.5 py-1 rounded-md text-sm sm:px-2"
      :aria-disabled="isFirstPage"
      :class="{ disabled: isFirstPage }"
      @click="currentPage = Math.max(currentPage - 1, 1)"
    >
      <span class="sr-only">Previous</span>
      <ChevronLeftIcon class="chevron-icon h-4 w-4" aria-hidden="true" />
    </PaginationButton>
    <template v-for="(item, index) in pagesData" :key="index">
      <PaginationButton
        v-if="item.type === 'page'"
        :use-route="useQuery"
        :to="{ query: item.number > 1 ? { page: item.number } : {}, hash: currentHash }"
        :aria-current="activePage === item.number ? 'page' : 'false'"
        :class="[{ active: activePage === item.number }, item.hiddenOnMobile ? 'hidden sm:flex' : 'flex']"
        class="pagination-page-button page bg-white no-underline px-1.5 py-1 rounded-md text-sm sm:px-2"
        @click="currentPage = item.number"
      >
        {{ item.number }}
      </PaginationButton>
      <span
        class="pagination-page-button dots px-1.5 py-1 rounded-md text-gray-2 text-sm hover:bg-white sm:px-2"
        v-else
      >
        ...
      </span>
    </template>

    <PaginationButton
      :use-route="useQuery"
      :to="{ query: nextButtonQuery, hash: currentHash }"
      class="pagination-page-button arrow right flex items-center no-underline px-1.5 py-1 rounded-md text-sm sm:px-2"
      :aria-disabled="isLastPage"
      :class="{ disabled: isLastPage }"
      @click="currentPage = Math.min(currentPage + 1, pageCount)"
    >
      <span class="sr-only">Next</span>
      <ChevronRightIcon class="chevron-icon h-4 w-4" aria-hidden="true" />
    </PaginationButton>
  </nav>
</template>

<script setup lang="ts">
import { computed, type UnwrapNestedRefs } from "vue";
import { useRoute } from "vue-router";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/outline";
import { useOffsetPagination, type UseOffsetPaginationReturn } from "@vueuse/core";

import PaginationButton from "@/components/common/PaginationButton.vue";

const route = useRoute();

const currentHash = computed(() => route?.hash);

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
  (eventName: "onPageChange", value: UnwrapNestedRefs<UseOffsetPaginationReturn>): void;
}>();

const { currentPage, pageCount, isFirstPage, isLastPage } = useOffsetPagination({
  total: computed(() => props.totalItems),
  page: computed({
    get: () => props.activePage,
    set: (val) => emit("update:activePage", val),
  }),
  pageSize: computed({
    get: () => props.pageSize,
    set: () => undefined,
  }),
  onPageChange: (data) => emit("onPageChange", data),
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

const backButtonQuery = computed(() => (currentPage.value > 2 ? { page: currentPage.value - 1 } : {}));
const nextButtonQuery = computed(() => ({ page: Math.min(currentPage.value + 1, pageCount.value) }));
</script>

<style lang="scss">
.pagination-container {
  &.disabled {
    color: #888;
    pointer-events: none;
  }

  .pagination-page-button {
    color: var(--color-gray);

    &:not(.disabled):not(.active):not(.dots):hover {
      background-color: var(--color-blue-lightest);
    }

    &.disabled {
      color: #888;
      cursor: not-allowed;
    }

    &.active {
      background-color: var(--color-blue-lightest);
      color: var(--color-black);
      z-index: 10;
    }
  }
}
</style>
