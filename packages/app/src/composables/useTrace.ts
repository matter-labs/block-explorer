import { computed, ref, watch } from "vue";

import type { MemoryType } from "@/components/debugger/MetadataBlock.vue";
import type { ComputedRef } from "vue";

type TraceSource = {
  assembly_code: string;
  active_lines: number[];
  pc_line_mapping: {
    [key: number]: number;
  };
};
export type MemoryInteraction = {
  address: string | number;
  direction: string;
  memory_type: string;
  page: number;
  value: string;
};

export type TraceStep = {
  calldata_page_index: number;
  code_page_index: number;
  contract_address: string;
  error: null | string;
  heap_page_index: number;
  memory_interactions: MemoryInteraction[];
  memory_snapshots: {
    length: number;
    memory_type: string;
    page: number;
    values: string[];
  }[];
  pc: number;
  register_interactions: { [key: number]: string };
  registers: string[];
  returndata_page_index: number;
  set_flags: unknown[];
  skip_cycle: boolean;
  sp: number;
  stack_page_index: number;
};

export type TraceFile = {
  sources: {
    [key: string]: TraceSource;
  };
  steps: TraceStep[];
};

export type HexDecimals = "Hex" | "Dec";

export default () => {
  const traceFile = ref<TraceFile | null>(null);
  const hasError = ref<boolean>(false);

  const upload = ([file]: File[] = []) => {
    return new Promise((resolve, reject) => {
      hasError.value = false;
      if (!file) {
        reject();
      }
      const reader = new FileReader();
      reader.readAsText(file);
      reader.addEventListener(
        "load",
        () => {
          try {
            if (typeof reader.result !== "string") {
              reject();
              return;
            }

            const obj = JSON.parse(reader.result) as TraceFile;
            if (Object.values(obj?.sources || {}).length > 0) {
              traceFile.value = obj;
              resolve(undefined);
            } else {
              hasError.value = true;
              reject();
            }
          } catch (e) {
            hasError.value = true;
            reject(e);
          }
        },
        false
      );
    });
  };

  return {
    file: computed(() => traceFile.value),
    upload,

    hasError: computed(() => hasError.value),
  };
};

export type ActiveStep = {
  address?: string;
  line?: number;
  step: TraceStep;
};

export type ActiveLines = {
  [key: string]: number[];
};

export const getMemoryDirection = (
  memoryInteractions: MemoryInteraction[],
  memoryType: MemoryType,
  pageIndex: number,
  address: number
) => {
  const directions = memoryInteractions
    .filter((mem) => mem.page === pageIndex && mem.memory_type === memoryType && mem.address === address)
    .map((mem) => mem.direction);
  const hasWrite = directions.includes("Write");
  const hasRead = directions.includes("Read");
  if (hasWrite) {
    return "Write";
  } else if (hasRead) {
    return "Read";
  } else {
    return undefined;
  }
};

export const memoryAtFrame = (
  steps: TraceStep[],
  activeIndex: number,
  memoryType: MemoryType,
  memoryPage: number
): Array<[number, string]> => {
  const state = steps.slice(0, activeIndex + 1).reduce<Map<number, string>>((memory, step) => {
    step.memory_snapshots
      .filter((snap) => snap.memory_type === memoryType && snap.page === memoryPage)
      .forEach((snap) => {
        snap.values.forEach((value, idx) => {
          memory.set(idx, value);
        });
      });
    step.memory_interactions
      .filter(
        (mem_int) => mem_int.direction === "Write" && mem_int.memory_type === memoryType && mem_int.page === memoryPage
      )
      .forEach((mem_int) => {
        memory.set(mem_int.address as number, mem_int.value);
      });
    return memory;
  }, new Map());
  return Array.from(state.entries()).sort((a, b) => a[0] - b[0]);
};

export function useTraceNavigation(trace: ComputedRef<TraceFile | null>, initialState?: { index: number }) {
  const index = ref<number | null>(initialState?.index ?? null);
  const activeLines = ref<ActiveLines>({});

  const goTo = (value: number) => {
    index.value = Math.max(0, Math.min(value, trace.value!.steps.length - 1));
  };

  const activeStep = computed<ActiveStep | null>(() => {
    if (!trace.value || !trace.value.steps || !trace.value.sources || index.value === null) {
      return null;
    }
    const step = trace.value.steps[index.value!];

    if (!step) {
      return null;
    }
    const line = trace.value.sources[step.contract_address]!.pc_line_mapping[step.pc];

    return {
      address: step.contract_address,
      line,
      step,
    };
  });

  const navigateToLine = (data: { line: number; address: string }) => {
    if (!trace.value) {
      return null;
    }
    const pcLineMapping = Object.values(trace.value.sources[data.address].pc_line_mapping);
    const pcIndex = pcLineMapping.indexOf(data.line) + 1;
    const step = trace.value.steps.find((value) => value.contract_address === data.address && value.pc === pcIndex);
    const index = trace.value.steps.indexOf(step!);
    goTo(index);
  };

  const getActiveLines = () => {
    if (!trace.value) {
      return null;
    }
    for (const [key, value] of Object.entries(trace.value.sources)) {
      const pcLineMapping = Object.values(value.pc_line_mapping);
      activeLines.value[key] = pcLineMapping.filter((_, index) => value.active_lines.includes(index + 1));
    }
  };

  const traceCountPercentage = computed<{ [key: string]: number }>(() => {
    if (!trace.value || !trace.value.steps || !trace.value.sources || index.value === null) {
      return {};
    }

    let maxCount = 0;
    const countDictionary = trace.value.steps.reduce((acc: { [key: string]: number }, step) => {
      const key = `${step.contract_address}_${step.pc}`;
      acc[key] = (acc[key] || 0) + 1;
      maxCount = Math.max(maxCount, acc[key]);
      return acc;
    }, {});

    const countPercentageDictionary: { [key: string]: number } = {};

    for (const [key, value] of Object.entries(countDictionary)) {
      countPercentageDictionary[key] = value / maxCount;
    }

    return countPercentageDictionary;
  });

  watch(trace, () => {
    index.value = null;
  });

  return {
    index,
    total: computed(() => trace.value?.steps.length),

    traceCountPercentage,
    activeStep,
    activeLines,

    goTo,
    navigateToLine,
    getActiveLines,
  };
}
