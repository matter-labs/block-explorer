<template>
  <nav class="navigation">
    <div class="navigation-search-input-container" :data-hotkey="inputText ? '' : searchHotkey">
      <input
        type="text"
        ref="navInput"
        class="navigation-search-input"
        v-model="inputText"
        :data-testid="$testId.traceSearchInput"
        :placeholder="t('debuggerTool.searchPlaceholder')"
      />
    </div>
    <div class="navigation-button-container">
      <button @click="first" class="navigation-button" :disabled="!index">
        <FirstArrow />
      </button>
      <button
        @click="previous"
        class="navigation-button"
        :disabled="!index"
        :data-testid="$testId.previousInstructionButton"
      >
        <LeftArrow />
      </button>
    </div>
    <div class="navigation-active-step" :class="{ 'navigation-active-step-direction': index === null }">
      <div class="navigation-active-step-label-container">
        <form @submit.prevent="goTo">
          <input
            v-model="activeIndex"
            type="text"
            @blur="goTo"
            @keypress="isNumber"
            :maxlength="String(props.total).length"
            :class="`active-index w-${String(props.total).length * 2}`"
          />
        </form>
        <span class="total">/ {{ total }}</span>
        <button :data-testid="$testId.showInstructionMetadataButton" class="show-metadata-button" @click="showMetadata">
          <InformationCircleIcon class="show-metadata-icon" />
        </button>
      </div>
      <div class="navigation-active-step-hotkeys">{{ t("debuggerTool.executionStepNavigation") }}</div>
    </div>
    <button @click="first" class="start" :class="{ 'not-started': index === null }">
      <span>{{ t("debuggerTool.start") }}</span>
      <LeftArrow class="arrow-right start-arrow" />
    </button>
    <div class="navigation-button-container">
      <button
        @click="next"
        class="navigation-button"
        :class="{ invisible: index === null }"
        :disabled="index! + 1 >= total || index === null"
        :data-testid="$testId.nextInstructionButton"
      >
        <LeftArrow class="arrow-right" />
      </button>
      <button @click="last" class="navigation-button" :disabled="index! + 1 >= total || index === null">
        <FirstArrow class="arrow-right" />
      </button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { InformationCircleIcon } from "@heroicons/vue/outline";
import { useMagicKeys } from "@vueuse/core";

import FirstArrow from "@/components/icons/FirstArrow.vue";
import LeftArrow from "@/components/icons/LeftArrow.vue";

const { t } = useI18n();

const emit = defineEmits<{
  (eventName: "nav:metadata"): void;
  (eventName: "nav:goTo", value: number): void;
  (eventName: "update:searchText", value: string | number | null): void;
}>();

const props = defineProps({
  index: {
    type: Number as PropType<number | null>,
    required: false,
  },
  total: {
    type: Number,
    required: true,
  },
  searchText: {
    type: String,
    default: "",
  },
});

const activeIndex = ref<string>("0");

function showMetadata() {
  emit("nav:metadata");
}
const previous = () => {
  emit("nav:goTo", props.index! - 1);
};
const next = () => {
  emit("nav:goTo", props.index! + 1);
};
const first = () => {
  emit("nav:goTo", 0);
};
const last = () => {
  emit("nav:goTo", props.total - 1);
};

const goTo = async () => {
  +activeIndex.value > 0 && +activeIndex.value <= props.total && Number.isInteger(+activeIndex.value)
    ? emit("nav:goTo", +activeIndex.value - 1)
    : emit("nav:goTo", 0);
  activeIndex.value = String(props.index! + 1);
};

const isNumber = (event: KeyboardEvent) => {
  var charCode = event.which ? event.which : event.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault();
  } else {
    return true;
  }
};

const navInput = ref<HTMLInputElement | null>(null);

const { right, left } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (((e.metaKey && isMac.value) || (e.ctrlKey && !isMac.value)) && e.code === "KeyK") {
      e.preventDefault();
      navInput.value?.focus();
    }
  },
});

const inputText = computed({
  get: () => props.searchText,
  set: (value: string | number | null) => {
    emit("update:searchText", value);
  },
});

const searchHotkey = computed(() => {
  return isMac.value ? "Cmd + K" : "Ctrl + K";
});

const isMac = computed(() => {
  return navigator.userAgent.indexOf("Mac OS X") != -1;
});

watch([left, right], ([leftValue, rightValue]) => {
  if (props.index === null) {
    return;
  }
  if (leftValue) {
    previous();
  }
  if (rightValue) {
    next();
  }
});

watch(
  () => props.index,
  (newValue) => {
    activeIndex.value = ((newValue ?? 0) + 1).toString();
  }
);
</script>

<style lang="scss" scoped>
.navigation {
  @apply sticky top-0 z-40 flex h-auto w-full flex-wrap items-center justify-between overflow-hidden bg-neutral-50 ring-1 ring-neutral-200 sm:h-9 sm:flex-nowrap;
}
.navigation-search-input-container {
  @apply h-full w-full flex-shrink flex-grow border-b sm:border-b-0;
  &:after {
    @apply absolute right-2 top-2 hidden text-sm text-neutral-400 content-[attr(data-hotkey)] lg:block;
  }
  .navigation-search-input {
    @apply h-full w-full rounded-none border-0 border-solid border-transparent bg-neutral-50 focus:border-primary-400 focus:ring-2 focus:ring-inset focus:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50;
    @apply placeholder:font-mono placeholder:text-sm;
  }
}

.navigation-active-step {
  @apply z-20 flex h-9 w-[calc(100%-97px)] flex-row items-center justify-center border-x border-b-0 border-t-0 border-solid border-neutral-200 bg-neutral-50 px-0 font-sans text-xs font-normal transition duration-500 ease-out sm:h-full sm:w-auto sm:px-2 md:px-3 lg:flex-col;
  .show-metadata-button {
    @apply block md:hidden;
    .show-metadata-icon {
      @apply h-4 w-4;
    }
  }
  .navigation-active-step-hotkeys {
    @apply hidden whitespace-nowrap text-[10px] text-neutral-400 lg:block;
  }
}
.navigation-active-step-direction {
  @apply w-[calc(100%-115px)] -translate-x-[35px] sm:w-auto sm:-translate-x-[39px];
}

.navigation-active-step-label-container {
  @apply flex gap-x-1;
  .active-index {
    @apply h-4 border-0 border-b border-neutral-400 bg-transparent p-0 text-center text-xs hover:border-neutral-600 focus:border-neutral-600 focus:ring-0 disabled:border-neutral-400;
  }
  .total {
    @apply whitespace-nowrap;
  }
}
.navigation-button-container {
  @apply inline-flex border-l last:border-x-0;
  .navigation-button {
    @apply flex h-9 w-6 flex-shrink-0 items-center justify-center rounded-none border-y-0 border-y-neutral-200 border-y-transparent bg-neutral-50 last:border-r-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-9;
  }
}
.arrow-right {
  @apply rotate-180;
}
.start {
  @apply absolute bottom-0 right-[25px] h-9 w-[68px] text-sm hover:bg-neutral-200 focus:bg-neutral-50 sm:right-[39px] sm:w-[76px];
  &.not-started {
    @apply z-10;

    .start-arrow {
      @apply opacity-100;
    }
  }

  .start-arrow {
    @apply mb-[3px] ml-[14px] inline opacity-0;
  }
}
</style>
