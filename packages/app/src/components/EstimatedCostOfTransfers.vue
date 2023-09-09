<template>
  <div class="card">
    <div class="title">{{ t("estimatedCost.title") }}</div>
    <div class="subtitle">{{ t("estimatedCost.subtitle") }}</div>
    <div class="costs">
      <div v-for="(cost, index) in costs" :key="`cost-${index}`" class="cost">
        <div>
          {{ cost.label }}
          <Popover v-if="cost.description" class="popover-container">
            <PopoverButton>
              <span>?</span>
              <PopoverPanel class="popover-panel">{{ cost.description }}</PopoverPanel>
            </PopoverButton>
          </Popover>
        </div>
        <span :title="cost.description">{{ formatMoney(cost.value) }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export interface Cost {
  label: string;
  value: number;
  description?: string;
}
</script>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";

import type { PropType } from "vue";

import { formatMoney } from "@/utils/formatters";
const { t } = useI18n();

defineProps({
  costs: {
    type: Array as PropType<Cost[]>,
    default: () => [],
    required: true,
  },
});
</script>

<style scoped lang="scss">
.card {
  @apply w-full rounded-lg bg-white py-5 pl-8 shadow;
  .title {
    @apply text-xl font-bold text-neutral-700;
  }
  .subtitle {
    @apply font-sans text-base text-neutral-400;
  }

  .costs {
    @apply mt-2 flex flex-wrap;
  }
  .cost {
    @apply mt-4 flex basis-full justify-between pr-8 sm:basis-1/2;
    > div {
      @apply text-base text-neutral-700;

      span {
        @apply mx-2 inline-block w-5 cursor-pointer rounded-full bg-neutral-200 text-center text-sm font-bold text-neutral-500 sm:mx-3;
      }
    }
    > span {
      @apply h-6 rounded-md bg-primary-600 px-2.5 text-base font-bold text-white;
    }
  }

  .popover-container {
    @apply relative inline;
  }

  .popover-panel {
    @apply absolute -top-10 left-1/2  -translate-x-1/2 transform rounded-lg bg-white p-2 px-3 text-sm text-neutral-700 shadow-lg;
  }
}
</style>
