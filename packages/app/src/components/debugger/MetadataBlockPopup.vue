<template>
  <Popup :opened="opened">
    <OnClickOutside @trigger="closeModal">
      <div class="metadata-popup-container">
        <div class="metadata-popup-header-container">
          <div v-if="activeStep?.line" class="metadata-popup-active-code">
            {{ activeStep.line + 1 }} {{ source[activeStep.line] }}
          </div>
          <div class="metadata-popup-nav-container">
            <button @click="first" class="navigation-button" :disabled="index === 0">
              <FirstArrow />
            </button>
            <button
              class="navigation-button"
              :data-testid="$testId.previousInstructionButton"
              :disabled="index === 0"
              @click="previous"
            >
              <LeftArrow />
            </button>
            <button
              class="navigation-button"
              :data-testid="$testId.nextInstructionButton"
              :disabled="index + 1 >= total"
              @click="next"
            >
              <LeftArrow class="rotate-icon" />
            </button>
            <button @click="last" class="navigation-button" :disabled="index + 1 >= total">
              <FirstArrow class="rotate-icon" />
            </button>
          </div>
        </div>
        <MetadataBlock
          class="metadata-popup-block"
          :metadata="activeStep?.step"
          :file="file!"
          :active-index="index"
          :data-format="dataFormat"
        />
        <div class="bg-white">
          <slot name="parent-child"></slot>
        </div>
      </div>
    </OnClickOutside>
  </Popup>
</template>

<script lang="ts" setup>
import { OnClickOutside } from "@vueuse/components";

import Popup from "@/components/common/Popup.vue";
import MetadataBlock from "@/components/debugger/MetadataBlock.vue";
import FirstArrow from "@/components/icons/FirstArrow.vue";
import LeftArrow from "@/components/icons/LeftArrow.vue";

import type { ActiveStep, HexDecimals, TraceFile } from "@/composables/useTrace";
import type { PropType } from "vue";

const props = defineProps({
  opened: {
    type: Boolean,
    default: false,
  },
  activeStep: {
    type: Object as PropType<ActiveStep>,
    default: undefined,
    required: false,
  },
  index: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  source: {
    type: Array as PropType<string[]>,
    required: true,
  },
  file: {
    type: Object as PropType<TraceFile | null>,
    required: false,
  },
  dataFormat: {
    type: String as PropType<HexDecimals>,
    default: "Hex",
  },
});

const emit = defineEmits<{
  (eventName: "nav:goTo", value: number): void;
  (eventName: "nav:metadata"): void;
}>();

const previous = () => {
  emit("nav:goTo", props.index - 1);
};
const next = () => {
  emit("nav:goTo", props.index + 1);
};
const first = () => {
  emit("nav:goTo", 0);
};

const last = () => {
  emit("nav:goTo", props.total - 1);
};
function closeModal() {
  emit("nav:metadata");
}
</script>

<style scoped lang="scss">
.metadata-popup-container {
  @apply z-10 overflow-hidden rounded;
  .metadata-popup-header-container {
    @apply grid grid-cols-[1fr_minmax(0,_144px)_max-content] items-center justify-between border-b bg-neutral-50;
    .metadata-popup-active-code {
      @apply mx-3 truncate font-mono text-neutral-600;
    }
    .metadata-popup-nav-container {
      @apply col-start-2 flex;
      .navigation-button {
        @apply flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-none  border-l border-y-neutral-200 border-y-transparent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50;
      }
    }
  }
  .metadata-popup-block {
    @apply grid max-h-[calc(100vh-100px)] overflow-y-scroll rounded-none;
  }
  .rotate-icon {
    @apply rotate-180;
  }
}
</style>
