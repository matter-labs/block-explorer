<template>
  <div class="info-field-time" :title="utcStringFromISOString(isoString)">
    <span class="time-ago" v-if="format === TimeFormat.FULL">{{ localDateFromISOString(isoString) }}</span>
    <span class="time-ago" v-else>{{ timeAgo }}</span>
    <span v-if="format === TimeFormat.TIME_AGO_AND_FULL" class="full-date">{{
      localDateFromISOString(isoString)
    }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useTimeAgo } from "@vueuse/core";

import { TimeFormat } from "@/types";
import { ISOStringFromUnixTimestamp, localDateFromISOString, utcStringFromISOString } from "@/utils/helpers";

const { t } = useI18n();

const props = defineProps({
  value: {
    type: [String, Number],
    default: "",
    required: true,
  },
  format: {
    type: String as PropType<TimeFormat>,
    default: TimeFormat.TIME_AGO_AND_FULL,
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
  align-items: center;
  color: var(--color-gray);
  display: flex;
  letter-spacing: -0.02em;

  .time-ago::first-letter {
    @apply capitalize;
  }

  .full-date {
    @apply ml-3 text-gray;
  }
}
</style>
