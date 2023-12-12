<template>
  <ul data-testid="instruction-list" class="instruction-list" ref="listElement" :style="{ height: height + 'px' }">
    <li
      v-for="item of virtualModel"
      :key="item.line"
      class="instruction-list-item"
      :class="{
        'has-error': item.error,
        expandable: item.expandable,
        highlighted: activeStep?.address === address && activeStep?.line === item.line,
        executed: isExecuted(item.line),
      }"
      :style="{ top: ITEM_HEIGHT * item.index + 'px' }"
      @click="handleClick(item)"
      :data-testid="item.expandable ? 'instruction-list-item-expandable' : 'instruction-list-item'"
    >
      <label class="instruction-list-line">{{ item.line + 1 }}</label>
      <span
        class="instruction-list-item-text-container"
        :style="{
          color: item.traceCountPercentage > 0.4 ? 'white' : 'black',
          backgroundColor: `rgba(200, 0, 0, ${item.traceCountPercentage}`,
        }"
      >
        <span class="instruction-list-item-text" v-html="highlight(item.label, searchText)"></span>
        <span v-if="item.error" class="instruction-list-item-error" :title="item.error">{{ item.error }}</span>
      </span>
      <ChevronUpIcon class="toggle-button" aria-hidden="true" v-if="item.expandable && expanded.includes(item.line)" />
      <ChevronDownIcon class="toggle-button" aria-hidden="true" v-else-if="item.expandable" />
    </li>
  </ul>
</template>

<script lang="ts">
export const ITEM_HEIGHT = 24;
export const ITEM_OFFSET = 2;
</script>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watchEffect } from "vue";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/vue/outline";
import { useResizeObserver, useThrottleFn } from "@vueuse/core";

import type { ActiveStep } from "@/composables/useTrace";
import type { PropType } from "vue";

import { highlight } from "@/utils/highlight";

const props = defineProps({
  address: {
    type: String,
    required: true,
  },
  source: {
    type: Array as PropType<string[]>,
    required: true,
  },
  errors: {
    type: Array as PropType<Array<undefined | string>>,
    default: () => [],
  },
  activeStep: {
    type: Object as PropType<ActiveStep | null>,
  },
  activeLines: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
  container: {
    type: Object as PropType<HTMLElement | null>,
    default: null,
  },
  searchText: {
    type: String,
    default: "",
  },
  traceCountPercentage: {
    type: Object as PropType<{ [key: string]: number }>,
    required: true,
  },
  pcLineMapping: {
    type: Object as PropType<{ [key: number]: number }>,
    required: true,
  },
});

type InstructionNode = {
  line: number;
  label: string;
  error?: string;
  parent: number | null;
  expandable: boolean;
};

type VirtualInstructionNode = InstructionNode & {
  index: number;
  traceCountPercentage: number;
};

const expanded = ref<number[]>([]);
const isReady = ref(false);

let data: InstructionNode[] = [];
const model = ref<VirtualInstructionNode[]>([]);
const virtualModel = ref<VirtualInstructionNode[]>([]);

const emit = defineEmits<{
  (eventName: "nav:navigateToLine", value: { line: number; address: string }): void;
}>();

const throttledRebuild = useThrottleFn(() => {
  rebuild();
}, 10);

watchEffect(() => {
  let parent: number | null = null;
  if (!props.source?.length) {
    data = [];
    return;
  }
  for (let j = 0; j < props.source.length; j++) {
    const label = props.source[j];
    const error = props.errors[j];
    const nextLabel = props.source[j + 1];
    if (label.trim().length) {
      data.push({
        line: j,
        label,
        error,
        parent,
        expandable: !!nextLabel?.includes(".func_begin"),
      });
    }

    if (nextLabel && nextLabel.includes(".func_begin")) {
      parent = j;
    }
    if (label.includes(".func_end")) {
      parent = null;
    }
  }
});

watchEffect(() => {
  model.value = data
    .filter((item) => {
      const val = item.parent === null || typeof item.parent === "undefined" || expanded.value?.includes(item.parent);
      if (props.searchText.length) {
        return item.label.toLocaleLowerCase().includes(props.searchText.toLowerCase());
      }
      return val;
    })
    .map((item, index) => ({
      ...item,
      index,
      line: item.line,
      traceCountPercentage:
        props.traceCountPercentage[
          `${props.address}_${Object.keys(props.pcLineMapping).find(
            (key) => props.pcLineMapping[parseInt(key)] === index
          )}`
        ],
    }));
  if (isReady.value) {
    rebuild();
  }
});

const listElement = ref<HTMLElement | null>(null);

function rebuild() {
  if (listElement.value) {
    const { top } = listElement.value.getBoundingClientRect();
    const bottom = document.documentElement.clientHeight - (top > 0 ? top : 0);

    const take = top > 0 ? 0 : Math.floor(Math.abs(top) / ITEM_HEIGHT);
    const skip = Math.floor(bottom / ITEM_HEIGHT);
    if (skip > -1 && take > -1) {
      virtualModel.value = model.value.slice(
        Math.max(0, take - ITEM_OFFSET),
        Math.min(take + skip + ITEM_OFFSET, model.value.length)
      );
    }
  }
}

watchEffect(() => {
  if (props.activeStep?.address !== props.address) {
    return;
  }
  const item = data.find((item) => item.line === props.activeStep?.line);

  if (!item) {
    return;
  }
  if (item.parent) {
    expanded.value = [...new Set([...expanded.value, item.parent])];
  }
});

watchEffect(() => {
  if (props.activeStep?.address !== props.address) {
    return;
  }
  const item = model.value.find((item) => item.line === props.activeStep?.line);

  if (!item) {
    return;
  }

  if (props.container) {
    const parentElement = listElement.value?.offsetParent as HTMLElement | null;
    const offset = parentElement?.offsetTop ?? 0;
    props.container.scroll(0, ITEM_HEIGHT * item.index + offset - 144);
  }
});

onMounted(() => {
  if (props.container) {
    props.container.addEventListener("scroll", throttledRebuild);
    useResizeObserver(props.container, throttledRebuild);
  }
  rebuild();
  isReady.value = true;
});

const height = computed(() => {
  return model.value.length * ITEM_HEIGHT;
});

const handleClick = (item: InstructionNode & { line: number }) => {
  if (expanded.value.includes(item.line)) {
    expanded.value = expanded.value.filter((i) => i !== item.line);
  } else {
    expanded.value = [...expanded.value, item.line];
  }

  if (props.activeLines.indexOf(item.line) !== -1) {
    emit("nav:navigateToLine", { line: item.line, address: props.address });
  }
};

const isExecuted = (line: number) => {
  return props.activeLines?.includes(line);
};

onUnmounted(() => {
  if (props.container) {
    props.container.removeEventListener("scroll", throttledRebuild);
  }
});
</script>

<style lang="scss" scoped>
.instruction-list {
  @apply relative overflow-hidden border-b border-solid border-b-neutral-200 bg-neutral-100;
}

.instruction-list-item {
  @apply absolute grid h-[v-bind('ITEM_HEIGHT+"px"')] w-full grid-cols-[50px_minmax(0,_1fr)_max-content] items-center gap-4 whitespace-pre px-4 font-mono text-sm font-normal leading-6 text-neutral-600;

  .toggle-button {
    @apply ml-auto h-5 w-5 text-neutral-700;
  }
  > .instruction-list-item-text-container {
    @apply overflow-hidden text-ellipsis whitespace-pre;

    .instruction-list-item-error {
      @apply ml-2 text-xs text-error-500;
    }
  }

  &.has-error {
    @apply bg-[#FDE48A];
  }

  &.expandable {
    @apply cursor-pointer font-bold;
    > .instruction-list-item-text {
      @apply font-bold;
    }
  }

  &.highlighted {
    @apply border-r-2 border-primary-400 bg-primary-100/40;
  }

  &.executed {
    @apply cursor-pointer border-l-2 border-solid border-primary-400;
    label {
      @apply cursor-pointer;
    }
  }
}
</style>

<style lang="scss">
.mark {
  @apply bg-transparent text-primary-500;
}
</style>
