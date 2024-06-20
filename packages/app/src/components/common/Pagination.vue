<template>
  <nav class="pagination-container" :class="{ disabled, header: header, footer: !header }" aria-label="Pagination">
    <div class="pagination-dropdown-container">
      <div class="pagination-text" v-if="header">Showing {{ pageSize }} of {{ totalItems }} Records</div>
      <div class="pagination-text" v-if="!header">Show:</div>
      <Menu class="dropdown-container" as="div" v-if="!header" v-slot="{ open }">
        <MenuButton>
          <div class="navigation-link" :class="{ active: open }">
            {{ currentPageSize }}
            <ChevronDownIcon class="dropdown-icon" aria-hidden="true" />
          </div>
        </MenuButton>
        <MenuItems class="dropdown-items">
          <MenuItem
            v-for="page in pageSizes"
            :key="page.label"
            :use-route="useQuery"
            :to="{ pageSizeButtonQuery }"
            class="dropdown-item"
            @click="currentPageSize = page.value"
          >
            <div>{{ page.label }}</div>
          </MenuItem>
        </MenuItems>
      </Menu>
      <div class="pagination-text" v-if="!header">Records</div>
    </div>
    <div class="pagination-number-container !ml-auto">
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
          :to="{ query: item.number > 1 ? { page: item.number } : {}, hash: currentHash }"
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
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, type UnwrapNestedRefs } from "vue";
import { useRoute } from "vue-router";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/outline";
import { useOffsetPagination, type UseOffsetPaginationReturn } from "@vueuse/core";

import PaginationButton from "@/components/common/PaginationButton.vue";

import { DEFAULT_PAGE_SIZE } from "@/utils/constants";

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
    default: DEFAULT_PAGE_SIZE,
  },
  useQuery: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  header: {
    type: Boolean,
    default: false,
  },
});

const pageSizes = [
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
];

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

const backButtonQuery = computed(() => {
  return currentPage.value > 2 ? { page: currentPage.value - 1 } : {};
});
const nextButtonQuery = computed(() => ({ page: Math.min(currentPage.value + 1, pageCount.value) }));

const pageSizeButtonQuery = computed(() => {
  return { pageSize: currentPageSize.value };
});
</script>

<style lang="scss">
.pagination-container {
  @apply flex space-x-1 w-full transition-opacity justify-between bg-white p-0;
  &.disabled {
    @apply pointer-events-none opacity-50;
  }
  &.header {
    @apply rounded-t-lg opacity-100;
  }
  &.footer {
    @apply rounded-b-lg;
  }

  .pagination-dropdown-container {
    @apply flex space-x-4;

    .pagination-text {
      @apply flex items-center text-sm font-medium text-neutral-700;
    }
    .dropdown-container {
      @apply relative rounded-md bg-slate-100 px-1.5 py-1 font-mono text-sm font-medium text-neutral-700 no-underline sm:px-2;

      .navigation-link {
        @apply flex items-center;
        &.active {
          // @apply bg-primary-800;

          .dropdown-icon {
            @apply -rotate-180;
          }
        }

        .dropdown-icon {
          @apply -mr-1 ml-2 h-4 w-4;
        }
      }
      .dropdown-items {
        @apply absolute left-0 mt-1 grid w-20 z-10 origin-top-left grid-flow-row gap-4 rounded-md bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none;

        .dropdown-item {
          @apply block rounded-md p-2 text-sm text-black no-underline cursor-pointer;
        }
      }
    }
  }

  .pagination-number-container {
    @apply flex space-x-1;

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
}
</style>
