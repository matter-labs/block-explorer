<template>
  <div class="page-index-container">
    <Tabs class="metadata-tabs" :tabs="tabs" :has-route="false">
      <template v-for="(data, i) in memoryData" :key="i" v-slot:[`tab-${i+1}-content`]>
        <div class="memory-badge-wrap">
          <template
            v-for="[address, value] in memoryAtFrame(file.steps, activeIndex,  data.type.toLowerCase() as MemoryType, data.index)"
            :key="address"
          >
            <div class="memory-badge-index-container">
              <div class="memory-badge-index" :class="{ 'index-width': address.toString().length > 4 }">
                {{ address }}
              </div>
            </div>
            <MemoryBadge
              :class="{ 'top-step': address.toString().length > 4 }"
              class="memory-badge-hash"
              :memory-direction="getMemoryDirection(metadata.memory_interactions, data.type.toLowerCase() as MemoryType, data.index, address)"
              :text="formatHexDecimals(value, dataFormat)"
              default-color="transparent"
            />
          </template>
        </div>
      </template>
    </Tabs>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";
import { useI18n } from "vue-i18n";

import Tabs from "@/components/common/Tabs.vue";
import MemoryBadge from "@/components/debugger/MemoryBadge.vue";

import { getMemoryDirection, type HexDecimals, memoryAtFrame } from "@/composables/useTrace";

import type { MemoryType } from "@/components/debugger/MetadataBlock.vue";
import type { TraceFile, TraceStep } from "@/composables/useTrace";

import { formatHexDecimals } from "@/utils/formatters";

const props = defineProps({
  activeIndex: {
    type: Number,
    default: 0,
  },
  typeTab: {
    type: String,
    default: "",
  },
  metadata: {
    type: Object as PropType<TraceStep>,
    required: true,
  },
  file: {
    type: Object as PropType<TraceFile>,
    required: true,
  },
  address: {
    type: String,
    default: "",
  },
  dataFormat: {
    type: String as PropType<HexDecimals>,
    default: "Hex",
  },
});

const { t } = useI18n();

const memoryData = computed(() => [
  {
    type: "stack",
    index: props.metadata.stack_page_index,
  },
  {
    type: "heap",
    index: props.metadata.heap_page_index,
  },
  {
    type: "code",
    index: props.metadata.code_page_index,
  },
  {
    type: "callData",
    index: props.metadata.calldata_page_index,
  },
  {
    type: "returnData",
    index: props.metadata.returndata_page_index,
  },
]);

const tabs = computed(() => [
  ...memoryData.value
    .filter((data) => !!data.index)
    .map((data) => {
      return {
        title: `${t(`debuggerTool.metadataBlock.memoryPageIndex.${data.type}`)} ${
          data.index ? `<span class="page-index">${data.index}</span>` : ""
        }`,
        hash: `#${data.type.toLowerCase()}`,
      };
    }),
]);
</script>

<style lang="scss">
.page-index-container .metadata-tabs {
  @apply font-mono text-sm font-normal;
  .memory-badge-wrap {
    @apply mb-2 grid grid-flow-col grid-cols-[minmax(20px,max-content)_auto] items-start gap-x-[2px] gap-y-[2px];
    .memory-badge-index-container {
      @apply max-w-[42px];
      .memory-badge-index {
        @apply col-[1] inline-block w-full min-w-[20px] text-ellipsis rounded bg-neutral-200 px-1 py-0 text-center text-sm leading-5;
      }
      .index-width {
        @apply table-cell max-w-fit;
      }
    }

    .memory-badge-hash {
      @apply col-[2] w-full flex-auto px-[2px] py-0 leading-5;
    }
    .top-step {
      @apply mt-[22px];
    }
  }
}

.page-index-container {
  .badge-container {
    @apply inline-block px-2;
  }
  .tab-main {
    @apply rounded-none;
    .active {
      @apply border-b;
    }
    .tab-head {
      @apply overflow-auto p-0;
      li {
        @apply flex-none;
      }
      .tab-btn {
        @apply flex items-center px-2 py-1 text-sm font-normal text-neutral-600;
        .page-index {
          @apply ml-1 min-w-[20px] rounded bg-neutral-200 px-1 font-normal font-normal;
        }
      }
    }
    .tab-content {
      @apply mt-2 rounded-none bg-transparent;
    }
  }
}
</style>
