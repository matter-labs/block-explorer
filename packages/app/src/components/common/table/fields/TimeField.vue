<template>
  <div class="info-field-time" :title="utcStringFromISOString(isoString)">
    <span class="time-ago">
      {{ timeAgo }}
    </span>
    <span v-if="showExactDate" class="full-date">{{ localDateFromISOString(isoString) }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useTimeAgo } from "@vueuse/core";

import { ISOStringFromUnixTimestamp, localDateFromISOString, utcStringFromISOString } from "@/utils/helpers";

const { t } = useI18n();

const props = defineProps({
  value: {
    type: [String, Number],
    default: "",
    required: true,
  },
  showExactDate: {
    type: Boolean,
    default: true,
    required: false,
  },
});

const messages = ref({
  justNow: computed(() => t("timeMessages.justNow")),
  past: (n: string) => (n.match(/\d/) ? `${n} ${t("timeMessages.past")}` : n),
  future: (n: string) => (n.match(/\d/) ? `${t("timeMessages.future")} ${n}` : n),
  month: (n: number, past: boolean) =>
    n === 1
      ? past
        ? t("timeMessages.lastMonth")
        : t("timeMessages.nextMonth")
      : `${n} ${n > 1 ? t("timeMessages.monthPlural") : t("timeMessages.month")}`,
  year: (n: number, past: boolean) =>
    n === 1
      ? past
        ? t("timeMessages.lastYear")
        : t("timeMessages.nextYear")
      : `${n} ${n > 1 ? t("timeMessages.yearPlural") : t("timeMessages.year")}`,
  day: (n: number, past: boolean) =>
    n === 1
      ? past
        ? t("timeMessages.yesterday")
        : t("timeMessages.tomorrow")
      : `${n} ${n > 1 ? t("timeMessages.dayPlural") : t("timeMessages.day")}`,
  week: (n: number, past: boolean) =>
    n === 1
      ? past
        ? t("timeMessages.lastWeek")
        : t("timeMessages.nextWeek")
      : `${n} ${n > 1 ? t("timeMessages.weekPlural") : t("timeMessages.week")}`,
  hour: (n: number) => `${n} ${n > 1 ? t("timeMessages.hourPlural") : t("timeMessages.hour")}`,
  minute: (n: number) => `${n} ${n > 1 ? t("timeMessages.minutePlural") : t("timeMessages.minute")}`,
  second: (n: number) => `${n} ${n > 1 ? t("timeMessages.secondPlural") : t("timeMessages.second")}`,
});

const isoString = computed(() => {
  if (typeof props.value === "number") {
    return ISOStringFromUnixTimestamp(props.value);
  }
  return props.value;
});

const timeAgo = useTimeAgo(isoString.value, { messages: messages.value });
</script>

<style lang="scss">
.info-field-time {
  @apply flex items-center;

  .time-ago::first-letter {
    @apply capitalize;
  }
  .full-date {
    @apply ml-3 text-gray-400;
  }
}
</style>
