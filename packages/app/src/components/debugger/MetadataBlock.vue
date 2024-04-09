<template>
  <div class="metadata-block" v-if="metadata" tabindex="0">
    <div class="metadata-header-container">
      <div class="meta-info contract-address">
        <HashLabel class="meta-hash-label" :subtraction="3" :text="metadata.contract_address" />
      </div>
      <div class="meta-title contract-title">{{ t("debuggerTool.metadataBlock.contract") }}</div>
    </div>
    <div class="meta-title tag-title">{{ t("debuggerTool.metadataBlock.tag") }}</div>
    <div class="meta-info tag-info">
      <Badge
        v-for="flag in ['lt', 'eq', 'gt']"
        :key="flag"
        class="badge-flag"
        :color="(metadata.set_flags.includes(flag) && 'progress') || 'danger'"
      >
        {{ flag }}
      </Badge>
    </div>
    <div class="meta-title">{{ t("debuggerTool.metadataBlock.registers") }}</div>
    <div class="meta-info">
      <div class="badge-wrap">
        <template v-for="(reg, index) in metadata.registers" :key="reg + index">
          <div class="memory-badge-index">{{ index + 1 }}</div>
          <div>
            <MemoryBadge
              class="memory-badge-hash"
              :text="reg"
              :memory-direction="metadata.register_interactions[index + 1]"
              default-color="neutral"
              :class="{ 'single-letter': reg.length === 1 }"
            />
          </div>
        </template>
      </div>
    </div>
    <template v-if="metadata.memory_interactions?.length">
      <div class="meta-title">{{ t("debuggerTool.metadataBlock.memoryChanges") }}</div>
      <div class="meta-info memory-changes-container">
        <div class="badge-wrap memory-changes-wrap">
          <template v-for="(memory, index) in metadata.memory_interactions" :key="memory.value + index">
            <div class="col-[1]">
              <div class="memory-badge-type">{{ memory.memory_type }}</div>
              <div class="memory-badge-index">
                {{ index }}
              </div>
            </div>
            <div>
              <MemoryBadge
                class="memory-badge-hash"
                :text="memory.value"
                :memory-direction="memory.direction"
                default-color="transparent"
                :class="{ 'single-letter': memory.value.length === 1 }"
              />
            </div>
          </template>
        </div>
      </div>
    </template>
    <div class="meta-title">{{ t("debuggerTool.metadataBlock.memory") }}</div>
    <div class="meta-info">
      <MetadataTabs :metadata="metadata" :active-index="activeIndex" :file="file" :data-format="dataFormat" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import Badge from "@/components/common/Badge.vue";
import HashLabel from "@/components/common/HashLabel.vue";
import MemoryBadge from "@/components/debugger/MemoryBadge.vue";
import MetadataTabs from "@/components/debugger/MetadataTabs.vue";

import type { HexDecimals, TraceFile, TraceStep } from "@/composables/useTrace";
import type { PropType } from "vue";
export type MemoryType = "stack" | "heap" | "code" | "calldata" | "returndata";

defineProps({
  metadata: {
    type: Object as PropType<TraceStep>,
    required: false,
  },
  activeIndex: {
    type: Number,
    default: 0,
  },
  file: {
    type: Object as PropType<TraceFile>,
    required: true,
  },
  dataFormat: {
    type: String as PropType<HexDecimals>,
    default: "Hex",
  },
});

const { t } = useI18n();
</script>
<style lang="scss">
.metadata-block {
  @apply h-max grid-cols-6 overflow-hidden rounded-md font-mono text-sm font-normal;
  .meta-title {
    @apply col-span-6 bg-white py-1 pl-2 leading-5 text-neutral-400 lg:col-span-6;
  }
  .tag-title {
    @apply col-span-1;
  }
  .meta-info {
    @apply col-span-6 h-max gap-y-2 bg-white py-1 pl-2 pr-2;
    .badge-flag {
      @apply mr-2 inline-block py-0 leading-5;
    }
    .meta-hash-label {
      @apply block;
    }
  }
  .metadata-header-container {
    @apply col-span-6 grid w-full grid-cols-1 border-b sm:grid-cols-2 lg:grid-cols-3;
    .contract-title {
      @apply order-1 col-span-1 py-2 pr-2 text-left sm:order-2 sm:text-right;
    }
    .contract-address {
      @apply order-2 col-span-1 py-0 pb-2 sm:order-1 sm:py-2 lg:col-span-2;
    }
  }

  .tag-info {
    @apply col-span-5 pl-0;
  }

  .badge-wrap {
    @apply mr-2 grid grid-flow-col grid-cols-[max-content_auto] gap-x-1 gap-y-[2px];
    .memory-badge-index {
      @apply col-[1] h-[20px] min-w-[20px] text-ellipsis rounded bg-neutral-200 px-[2px] text-center leading-5;
    }
    .memory-badge-hash {
      @apply col-[2] w-full min-w-[20px] px-[2px] py-0 leading-5;
      .badge-content {
        @apply w-full;
      }
    }
    .badge-container {
      @apply text-sm leading-5;
    }
    .single-letter {
      @apply text-center;
    }
  }
  .memory-changes-container {
    @apply pt-0;
  }

  .memory-changes-wrap {
    .memory-badge-hash {
      @apply mt-5;
    }
    .memory-badge-type {
      @apply absolute top-0 ml-0 text-neutral-600;
    }
    .memory-badge-index {
      @apply mt-5;
    }
  }
}
</style>
