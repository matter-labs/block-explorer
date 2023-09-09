<template>
  <tr v-for="(_, index) of Array.from({ length: size })" :key="index">
    <TableBodyColumn>
      <ContentLoader class="h-4 w-36" />
    </TableBodyColumn>
    <TableBodyColumn>
      <ContentLoader class="h-4 w-32" />
    </TableBodyColumn>
    <TableBodyColumn class="tablet-column-hidden">
      <ContentLoader class="h-4 w-36" />
    </TableBodyColumn>
    <TableBodyColumn class="tablet-column">
      <ContentLoader class="mb-1.5 h-4 w-48" />
      <ContentLoader class="h-4 w-48" />
    </TableBodyColumn>
    <TableBodyColumn class="tablet-column-hidden">
      <ContentLoader class="h-4 w-36" />
    </TableBodyColumn>
    <TableBodyColumn>
      <ContentLoader class="mb-1.5 h-4 w-24" />
      <ContentLoader class="h-3.5 w-12" />
    </TableBodyColumn>
  </tr>
</template>

<script lang="ts" setup>
import ContentLoader from "@/components/common/loaders/ContentLoader.vue";
import TableBodyColumn from "@/components/common/table/TableBodyColumn.vue";

defineProps({
  size: {
    type: Number,
    required: true,
  },
});
</script>
