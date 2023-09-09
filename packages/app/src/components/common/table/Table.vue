<template>
  <div class="table-container" :class="[{ 'has-head': !!$slots['table-head'] }, { 'has-footer': !!$slots['footer'] }]">
    <div class="table-body">
      <table cellspacing="0" cellpadding="0">
        <thead v-if="$slots['table-head']">
          <tr>
            <slot name="table-head"></slot>
          </tr>
        </thead>
        <tbody v-if="!loading">
          <slot />
          <template v-if="items?.length">
            <tr v-for="(item, index) in items" :key="index">
              <slot name="table-row" :item="item" :index="index"></slot>
            </tr>
          </template>
          <template v-else-if="$slots.empty && !failed">
            <slot name="empty"></slot>
          </template>
          <template v-else-if="$slots.failed && failed">
            <slot name="failed"></slot>
          </template>
        </tbody>
        <tbody v-else>
          <slot name="loading" />
        </tbody>
      </table>
    </div>
    <div v-if="$slots.footer" class="table-footer" :class="[items?.length! % 2 ? 'bg-neutral-50' : 'bg-white']">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

defineProps({
  items: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Array as PropType<any[] | null>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: true,
  },
  failed: {
    type: Boolean,
    default: false,
  },
});
</script>

<style lang="scss">
.table-container {
  @apply w-full rounded-lg shadow-md;

  .table-body {
    @apply w-full overflow-auto;

    & > table > thead tr {
      @apply absolute left-[-9999px] top-[-9999px] md:relative md:left-0 md:top-0;
    }
  }
  &.has-head {
    table thead tr th {
      @apply first:rounded-tl-lg last:rounded-tr-lg;
    }
  }
  &:not(.has-head) {
    table tbody tr:first-child td {
      @apply first:rounded-tl-lg last:rounded-tr-lg;
    }
  }
  &:not(.has-footer) {
    .table-body {
      @apply rounded-b-lg;
    }

    table tbody tr:last-child td {
      @apply first:rounded-bl-lg last:rounded-br-lg;
    }
  }

  table {
    @apply w-full border-collapse border-none;

    thead {
      @apply md:border-b;

      tr th {
        @apply bg-gray-100;
      }
    }
    tbody {
      tr {
        @apply transition last:border-b-0 odd:bg-white even:bg-gray-50 md:border-b;
      }
    }
  }
  .table-footer {
    @apply w-full rounded-b-lg;
  }
}
</style>
