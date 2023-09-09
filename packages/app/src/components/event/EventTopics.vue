<template>
  <div v-for="(topic, topicIndex) in topics" :key="topic" class="topic-container">
    <div class="topic-index-container">{{ topicIndex }}</div>
    <span v-if="topicIndex === 0" class="topic-value">
      <span>{{ topic }}</span>
      <CopyButton v-if="showCopyButton" :value="topic" />
    </span>
    <HashViewer
      v-else
      :hash="topic"
      :default-type="getTypeFromEvent(event!, topicIndex)"
      :popover-placement="popoverPlacement"
      v-slot="{ data, selected }"
    >
      <div class="data-value">
        <ArrowRightIcon class="arrow-right-icon" />
        <AddressLink v-if="isAddress(data)" :address="(data as Address)">
          <span class="only-desktop">{{ checksumAddress(data as Address) }}</span>
          <span class="only-mobile">{{ shortenFitText(checksumAddress(data as Address), "left", 230, 10) }}</span>
        </AddressLink>
        <span v-else>
          <span class="only-desktop">{{ data }}</span>
          <span class="only-mobile data-value-mobile">
            <span v-if="selected === 'text'" class="text-value">{{ data }}</span>
            <span v-else>
              {{ shortenFitText(data, "left", selected === "number" ? 230 : 280, 10) }}
            </span>
          </span>
        </span>
        <CopyButton v-if="showCopyButton" :value="isAddress(data) ? checksumAddress(data as Address) : data" />
      </div>
    </HashViewer>
  </div>
</template>
<script lang="ts" setup>
import { ArrowRightIcon } from "@heroicons/vue/outline";

import AddressLink from "@/components/AddressLink.vue";
import CopyButton from "@/components/common/CopyButton.vue";
import { shortenFitText } from "@/components/common/HashLabel.vue";
import HashViewer from "@/components/transactions/infoTable/HashViewer.vue";

import type { TransactionEvent } from "@/composables/useEventLog";
import type { Address } from "@/types";
import type { PropType } from "vue";

import { checksumAddress } from "@/utils/formatters";
import { getTypeFromEvent } from "@/utils/helpers";
import { isAddress } from "@/utils/validators";

defineProps({
  topics: {
    type: Array as PropType<string[]>,
    required: true,
  },
  event: {
    type: Object as PropType<TransactionEvent>,
    required: false,
  },
  popoverPlacement: {
    type: String as PropType<"top" | "bottom" | "right">,
    default: "bottom",
  },
  showCopyButton: {
    type: Boolean,
    default: false,
  },
});
</script>
<style lang="scss">
.topic-container {
  @apply flex gap-4;
  &:not(:last-child) {
    @apply mb-4;
  }
  .data-value {
    @apply flex w-full items-center gap-4 md:justify-start;
    .data-value-mobile {
      @apply grid md:hidden;
    }
  }
  .arrow-right-icon {
    @apply h-4 w-4 min-w-[1rem] text-neutral-600;
  }
  .topic-index-container {
    @apply h-6 rounded bg-gray-200 px-2 py-0.5 font-mono text-sm leading-5 text-gray-400;
  }
  .toggle-button {
    @apply h-auto text-neutral-600;
    .toggle-button-icon {
      @apply text-neutral-600;
    }
  }
  .topic-value {
    @apply w-[calc(100vw-127px)] whitespace-pre-wrap break-words sm:w-[calc(100vw-146px)] md:w-auto;
  }
  .only-mobile {
    @apply flex md:hidden;
  }
  .only-desktop {
    @apply hidden md:flex;
  }
  .text-value {
    @apply overflow-hidden text-ellipsis;
  }
  .copy-button-container {
    @apply ml-4 inline;
    .copy-button {
      @apply pt-0;
    }
  }
}
</style>
