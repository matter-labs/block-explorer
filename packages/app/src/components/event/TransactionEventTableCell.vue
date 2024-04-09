<template>
  <router-link :to="{ name: 'transaction', params: { hash: item.transactionHash } }" class="transaction-hash">
    <HashLabel :text="item.transactionHash" />
    <span class="only-desktop">{{ item.transactionHash }}</span>
  </router-link>
  <EventTopics :topics="item.topics" :event="item.event" :popover-placement="popoverPlacement" />
  <div class="data-row">
    <HashViewer
      :hash="item.data"
      :default-type="getTypeFromEvent(item.event!, item.event ? item.event.inputs.length : 0)"
      :popover-placement="popoverPlacement"
      v-slot="{ data, selected }"
    >
      <div class="data-container">
        <span>
          {{ t("contract.events.value") }}:
          <ExpandableText
            :max-height="360"
            :class="{ 'smaller-width': selected === 'number' || selected === 'address' }"
          >
            <template #default>
              {{ data }}
            </template>
            <template #button="{ expanded }">
              {{ expanded ? t("contract.events.hide") : t("contract.events.showMore") }}
            </template>
          </ExpandableText>
        </span>
      </div>
    </HashViewer>
  </div>
</template>
<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import ExpandableText from "@/components/common/ExpandableText.vue";
import HashLabel from "@/components/common/HashLabel.vue";
import EventTopics from "@/components/event/EventTopics.vue";
import HashViewer from "@/components/transactions/infoTable/HashViewer.vue";

import type { TransactionLogEntry } from "@/composables/useEventLog";
import type { PropType } from "vue";

import { getTypeFromEvent } from "@/utils/helpers";

const { t } = useI18n();

defineProps({
  item: {
    type: Object as PropType<TransactionLogEntry>,
    required: true,
  },
  popoverPlacement: {
    type: String as PropType<"top" | "bottom">,
    default: "bottom",
  },
});
</script>
<style lang="scss">
.transaction-hash {
  @apply mb-4 inline-block;
  .actual-string {
    @apply hidden;
  }
  .hash-label-component {
    @apply inline md:hidden;
  }
}
.only-desktop {
  @apply hidden md:flex;
}
.data-row {
  @apply flex gap-4;
}
.option-list-item {
  @apply flex items-center;
}
.data-container {
  @apply w-full rounded bg-neutral-200 p-4 pr-0 text-gray-400 sm:pr-4;
  span {
    @apply flex;
    .expandable-text {
      @apply w-[40vw] whitespace-pre-wrap break-words bg-inherit p-0 pl-2 text-neutral-600;
    }
    .smaller-width {
      @apply w-[32vw] sm:w-[40vw];
    }
  }
}
</style>
