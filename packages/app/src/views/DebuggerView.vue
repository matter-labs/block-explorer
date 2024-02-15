SourceNode
<template>
  <EmptyState :has-error="hasError" v-if="hasError || !collection?.length" @update:value="upload" />
  <section v-else>
    <div class="head-block">
      <UploadFile v-slot="obj" class="upload-file" @update:value="upload" :accept="'.json'">
        <UploadIcon class="upload-file-icon" /><label :for="obj.for" class="upload-file-label">
          {{ t("debuggerTool.uploadJSON") }}
        </label>
        {{ t("debuggerTool.orDropHere") }}
      </UploadFile>
    </div>
    <section class="debugger" :class="{ 'debugger-full-screen': isFullScreen }">
      <div class="debugger-header">
        <h2>{{ t("debuggerTool.transaction") }}</h2>
        <div class="full-screen-container">
          <Dropdown v-model="dataFormat" :options="dataFormatOptions" class="hex-decimals-dropdown" />
          <span>{{ fullScreenHotkey }}</span>
          <button @click="isFullScreen = !isFullScreen">
            <ExpandIcon />
          </button>
        </div>
      </div>
      <div
        ref="traceColumnElement"
        class="debugger-trace-height"
        :class="{ 'debugger-full-screen-height': isFullScreen }"
      >
        <Navigation
          class="file-list-nav"
          @nav:metadata="openModal"
          @nav:goTo="goTo"
          v-model:searchText="searchText"
          :index="activeIndex"
          :total="total!"
        />
        <ul class="file-list">
          <li v-for="item of collection" :key="item.address" class="file-list-item">
            <div
              tabindex="0"
              @keypress.enter="handleClick(item)"
              class="file-list-item-data"
              :class="{ disabled: searchText.length }"
              @click="handleClick(item)"
              data-testid="file-list-item-toggle"
            >
              <HashLabel :text="item.address" placement="middle" class="file-list-item-data-hash-label" />
              <label v-if="item.fileName">{{ item.fileName }}</label>
              <template v-if="!searchText.length">
                <ChevronUpIcon class="toggle-button" aria-hidden="true" v-if="item.expanded" />
                <ChevronDownIcon class="toggle-button" aria-hidden="true" v-else />
              </template>
            </div>
            <SourceViewer
              v-if="item.expanded || searchText.length"
              :address="item.address"
              :source="item.source"
              :errors="item.errors"
              :container="traceColumnElement"
              :activeStep="activeStep"
              :searchText="searchText"
              :active-lines="activeLines[item.address]"
              :traceCountPercentage="traceCountPercentage"
              :pcLineMapping="item.pcLineMapping"
              @nav:navigateToLine="navigateToLine"
            />
            <MetadataBlockPopup
              v-if="item.expanded && item.address === activeStep?.address"
              :address="item.address"
              :source="item.source"
              :opened="opened"
              @nav:metadata="closeModal"
              @nav:goTo="goTo"
              :total="total!"
              :index="activeIndex!"
              :file="file"
              :activeStep="formattedActiveStep"
              :data-format="dataFormat"
            >
              <template v-if="parent || child" v-slot:[`parent-child`]>
                <div class="parent-child-tabs-container">
                  <Tabs class="parent-child-tabs" :tabs="tabs" :has-route="false">
                    <template v-for="(data, i) in tabData" :key="i" v-slot:[`tab-${i+1}-header`]>
                      <template v-if="data">
                        <div class="parent-child-header">
                          <HashLabel
                            class="parent-child-address"
                            :subtraction="3"
                            :text="data.value?.contract_address"
                          />
                          <span class="parent-child-type" v-if="data">{{ t(`debuggerTool.${data.type}`) }}</span>
                        </div>
                      </template>
                    </template>
                    <template v-for="(data, i) in tabData" :key="i" v-slot:[`tab-${i+1}-content`]>
                      <MetadataTabs
                        v-if="data"
                        :metadata="data.value!"
                        :type-tab="data.type"
                        :active-index="data.index"
                        :file="file!"
                        :data-format="dataFormat"
                      />
                    </template>
                  </Tabs>
                </div>
              </template>
            </MetadataBlockPopup>
          </li>
        </ul>
      </div>
      <div
        class="debugger-trace-height debugger-metadata-block-container"
        :class="{ 'debugger-full-screen-height': isFullScreen }"
      >
        <MetadataBlock
          v-if="formattedActiveStep"
          class="debugger-metadata-block"
          :metadata="formattedActiveStep.step"
          :file="file!"
          :active-index="activeIndex!"
          :data-format="dataFormat"
        />
        <div
          v-if="activeStep && tabs && (parent || child)"
          class="parent-child-tabs-container"
          :class="{ 'tabs-full-screen-container': isFullScreen }"
        >
          <Tabs class="parent-child-tabs" :tabs="tabs" :has-route="false">
            <template v-for="(data, i) in tabData" :key="i" v-slot:[`tab-${i+1}-header`]>
              <template v-if="data">
                <div class="parent-child-header">
                  <HashLabel class="parent-child-address" :subtraction="3" :text="data.value?.contract_address" />
                  <span class="parent-child-type">{{ t(`debuggerTool.${data.type}`) }}</span>
                </div>
              </template>
            </template>
            <template v-for="(data, i) in tabData" :key="i" v-slot:[`tab-${i+1}-content`]>
              <MetadataTabs
                v-if="data"
                :metadata="data.value!"
                :type-tab="data.type"
                :active-index="data.index"
                :file="file!"
                :data-format="dataFormat"
              />
            </template>
          </Tabs>
        </div>
      </div>
      <div v-if="isFullScreen && (parent || child)" class="parent-child-section debugger-full-screen-height">
        <div class="parent-child-item" v-if="parent">
          <div class="parent-child-item-header">
            <HashLabel class="parent-child-address" :subtraction="3" :text="parent.value!.contract_address" />
            <span class="parent-child-type">{{ t(`debuggerTool.${parent.type}`) }}</span>
          </div>
          <MetadataTabs
            :metadata="parent.value!"
            :type-tab="parent.type"
            :active-index="parent.index"
            :file="file!"
            :data-format="dataFormat"
          />
        </div>
        <div class="parent-child-item" v-if="child">
          <div class="parent-child-item-header">
            <HashLabel class="parent-child-address" :subtraction="3" :text="child.value!.contract_address" />
            <span class="parent-child-type">{{ t(`debuggerTool.${child.type}`) }}</span>
          </div>
          <MetadataTabs
            class="metadata-full-screen"
            :metadata="child.value!"
            :type-tab="child.type"
            :active-index="child.index"
            :file="file!"
            :data-format="dataFormat"
          />
        </div>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
import { computed, type ComputedRef, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/outline";
import { UploadIcon } from "@heroicons/vue/outline";

import Dropdown from "@/components/common/Dropdown.vue";
import HashLabel from "@/components/common/HashLabel.vue";
import Tabs, { type Tab } from "@/components/common/Tabs.vue";
import UploadFile from "@/components/common/UploadFile.vue";
import EmptyState from "@/components/debugger/EmptyState.vue";
import MetadataBlock from "@/components/debugger/MetadataBlock.vue";
import MetadataBlockPopup from "@/components/debugger/MetadataBlockPopup.vue";
import MetadataTabs from "@/components/debugger/MetadataTabs.vue";
import Navigation from "@/components/debugger/Navigation.vue";
import SourceViewer from "@/components/debugger/SourceViewer.vue";
import ExpandIcon from "@/components/icons/ExpandIcon.vue";

import useFullHeight from "@/composables/useFullHeight";
import useTrace, { type HexDecimals, type TraceStep, useTraceNavigation } from "@/composables/useTrace";

import { mapStep } from "@/utils/mappers";

const traceColumnElement = ref<HTMLElement | null>(null);

const { t } = useI18n();

const { isFullScreen, fullScreenHotkey } = useFullHeight();

const { file, upload, hasError } = useTrace();
const {
  activeStep,
  goTo,
  index: activeIndex,
  traceCountPercentage,
  activeLines,
  total,
  navigateToLine,
  getActiveLines,
} = useTraceNavigation(file);
type SourceNode = {
  address: string;
  fileName: string | null;
  source: string[];
  errors: Array<undefined | string>;
  expanded: boolean;
  pcLineMapping: {
    [key: number]: number;
  };
};
const collection = ref<SourceNode[]>();
const opened = ref(false);

const formattedActiveStep = ref();

function openModal() {
  opened.value = true;
}
function closeModal() {
  opened.value = false;
}

const searchText = ref("");

const tabData = ref<parentChildBlock[]>([]);

const dataFormatOptions = computed(() => [t("debuggerTool.hex"), t("debuggerTool.dec")]);
const dataFormat = ref<HexDecimals>(dataFormatOptions.value[0] as HexDecimals);

watchEffect(() => {
  if (activeStep.value) {
    formattedActiveStep.value = {
      ...activeStep.value,
      step: mapStep(activeStep.value.step, dataFormat.value),
    };
  }
});

const tabs: ComputedRef<Tab[]> = computed(() => {
  let result = [];
  if (parent.value) {
    result.push({ hash: "parent" });
  }
  if (child.value) {
    result.push({ hash: "child" });
  }
  return result as Tab[];
});

type parentChildBlock = {
  value: TraceStep | undefined;
  index: number;
  type: string;
};

type ContractsVariations = {
  address: string;
  lastItem: number;
  firstItem: number;
};

const contractsVariations = ref<ContractsVariations[]>([]);
const parent = ref<null | parentChildBlock>(null);
const child = ref<null | parentChildBlock>(null);

watchEffect(() => {
  child.value = null;
  parent.value = null;
  tabData.value = [];
  if (file.value?.steps && activeStep.value) {
    contractsVariations.value = file.value.steps.reduce((previousValue: ContractsVariations[], element, index) => {
      if (previousValue.length && previousValue[previousValue.length - 1].address === element.contract_address) {
        previousValue[previousValue.length - 1].lastItem = index;
      } else {
        previousValue.push({ address: element.contract_address, firstItem: index, lastItem: index });
      }
      return previousValue;
    }, []);

    contractsVariations.value.forEach((item, index) => {
      if (
        item.address === activeStep.value?.step?.contract_address &&
        index > 0 &&
        activeIndex.value! >= item.firstItem
      ) {
        parent.value = {
          value: mapStep(
            file.value?.steps[contractsVariations.value[index - 1]?.lastItem] ?? ({} as TraceStep),
            dataFormat.value
          ),
          index: contractsVariations.value[index - 1]?.lastItem,
          type: "parent",
        };
        tabData.value.push(parent.value);
      }
      if (
        item.address === activeStep.value?.step?.contract_address &&
        index < contractsVariations.value?.length - 1 &&
        activeIndex.value! <= item.lastItem
      ) {
        child.value = {
          value: mapStep(
            file.value?.steps[contractsVariations.value[index + 1]?.firstItem] ?? ({} as TraceStep),
            dataFormat.value
          ),
          index: contractsVariations.value[index + 1]?.firstItem,
          type: "child",
        };
        tabData.value.push(child.value);
      }
    });
  }
});

watchEffect(() => {
  if (file.value) {
    getActiveLines();
    collection.value = Object.entries(file.value.sources).map(([address, item]) => {
      const source: string[] = item.assembly_code?.split("\n") ?? [];
      const errors: Array<undefined | string> = [];
      file.value!.steps.forEach((step) => {
        errors[item.pc_line_mapping[step.pc]] = step.error ?? undefined;
      });
      let fileName: string | null = null;
      const line = source.find((item) => item.includes(".file"));
      if (line && line.length) {
        const match = line.match(new RegExp('"(.*?)"'));
        if (match && match.length > 1) {
          fileName = match[1];
        }
      }
      return {
        address,
        fileName,
        source,
        errors,
        expanded: false,
        pcLineMapping: item.pc_line_mapping,
      };
    });
  } else {
    collection.value = [];
  }
  searchText.value = "";
});

const handleClick = (item: SourceNode) => {
  if (searchText.value) {
    return;
  }
  item.expanded = !item.expanded;
};

watchEffect(() => {
  const { address } = activeStep.value || {};

  if (!address) {
    return;
  }

  const item = collection.value?.find((item) => item.address === address);
  if (item) {
    item.expanded = true;
  }
});
</script>

<style lang="scss">
.parent-child-tabs-container .parent-child-tabs,
.parent-child-section {
  @apply border-t pb-2 sm:border-t-0 md:pb-0;
  .active {
    @apply border-b;
  }
  .tab-head {
    @apply divide-x pl-0 pt-0;
    li {
      @apply flex-1;
    }
    .tab-btn {
      @apply w-full py-[7px];
    }
  }

  .metadata-tabs {
    @apply px-2;
    .tab-head {
      @apply divide-x-0 pl-0;
      li {
        @apply flex-none;
      }
      button {
        @apply w-fit;
      }
    }
  }
}
.full-screen-container {
  .hex-decimals-dropdown {
    @apply flex sm:mr-4;
    .toggle-button {
      @apply h-auto border-none bg-neutral-200 py-0.5 pl-1.5 pr-0 sm:min-w-[3.5rem];
      .toggle-button-icon-wrapper {
        @apply static inline-flex pr-0 align-bottom;
      }
    }
    .options-list-container {
      @apply right-0 top-6 z-50 w-auto md:right-auto;
      span.check-icon-container {
        @apply static right-0 inline-flex pl-1 align-bottom;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.head-block {
  @apply flex items-center justify-end;
  .upload-file {
    @apply relative inline-flex items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-500 bg-transparent px-2 py-4 text-sm text-white sm:px-4  sm:text-base;

    &.active {
      @apply border-solid bg-neutral-50/20;
    }
  }

  .upload-file-icon {
    @apply mr-1.5 h-6 w-6;
  }
  .upload-file-label {
    @apply cursor-pointer font-medium text-white underline;
  }
}

.parent-child-section {
  @apply hidden overflow-auto px-2 4xl:block;
  .parent-child-item {
    @apply my-2 overflow-hidden rounded-md border bg-white;
    .parent-child-item-header {
      @apply flex justify-between border-b px-2 py-1;
      .parent-child-type {
        @apply font-mono text-neutral-400;
      }
    }
  }
}

.parent-child-address {
  @apply block max-w-sm text-left font-mono text-sm text-neutral-600;
}

.debugger-metadata-block-container {
  @apply md:p-2;
  .parent-child-tabs-container {
    @apply mt-2 hidden md:block;
    .parent-child-tabs {
      @apply overflow-hidden rounded-md border;
    }
  }
  .tabs-full-screen-container {
    @apply 4xl:hidden;
  }
}
.parent-child-header {
  @apply flex justify-between;
  .parent-child-type {
    @apply font-mono text-sm text-neutral-400;
  }
}

.debugger {
  @apply my-2 grid grid-cols-1 grid-rows-[max-content_max-content_max-content] rounded-lg border-r bg-neutral-100 shadow-md md:grid-cols-2;
  .debugger-header {
    @apply col-span-3 flex h-[52px] items-center justify-between whitespace-nowrap rounded-t-lg border border-r-0 border-solid border-neutral-200 bg-neutral-100 px-4;
    h2 {
      @apply font-sans text-base font-medium text-neutral-800;
    }
    .full-screen-container {
      @apply flex items-center;
      span {
        @apply mr-4 hidden text-neutral-400 lg:block;
      }
      button {
        @apply hidden sm:block;
      }
    }
  }
  .file-list {
    @apply z-10 col-start-1 col-end-2;
  }

  .debugger-trace-height {
    @apply h-[calc(100vh-350px)] overflow-auto rounded-bl-lg rounded-br-lg border-r md:rounded-br-none;
  }

  .debugger-full-screen-height {
    @apply h-[calc(100vh-52px)];
  }

  .debugger-metadata-block {
    @apply hidden auto-cols-fr auto-rows-max border md:grid;
  }
  .debugger-metadata-block-wrap {
    @apply px-2;
  }
  .file-list-item-data {
    @apply sticky top-9 z-50 flex h-9 w-full cursor-pointer items-center gap-3 overflow-hidden border-b border-b-neutral-200 bg-white p-[6px] px-4 font-mono text-sm font-normal text-neutral-700 focus:bg-primary-100 focus:outline-0;
    > label {
      @apply inline-flex h-5 cursor-pointer items-center justify-center rounded border border-solid border-neutral-200 bg-neutral-100 px-1 font-sans text-sm font-normal text-neutral-700;
    }

    .file-list-item-data-hash-label {
      @apply h-5;
    }

    .toggle-button {
      @apply ml-auto h-5 w-5 min-w-[20px] text-neutral-700;
    }

    &.disabled {
      @apply cursor-default;
    }
  }
}

.debugger-full-screen {
  @apply fixed -bottom-4 left-0 right-0 top-0 z-[100] mt-0 4xl:grid-cols-3;
}
</style>
