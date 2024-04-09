<template>
  <h1 class="debugger-empty-state-title">{{ t("debuggerTool.title") }}</h1>
  <p class="debugger-empty-state-description">{{ t("debuggerTool.whatFor") }}</p>
  <section class="debugger-empty-upload-file-wrapper">
    <Alert class="error-alert" v-if="hasError">{{ t("debuggerTool.unableToParseTrace") }}</Alert>
    <UploadFile v-slot="obj" class="upload-file" @update:value="upload" accept=".json">
      <UploadIcon class="upload-file-icon" />
      <label :for="obj.for" class="upload-file-label">{{ t("debuggerTool.uploadJSON") }}</label>
      {{ t("debuggerTool.orDropHere") }}
    </UploadFile>
  </section>
</template>
<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import { UploadIcon } from "@heroicons/vue/outline";

import Alert from "@/components/common/Alert.vue";
import UploadFile from "@/components/common/UploadFile.vue";

const { t } = useI18n();

defineProps({
  hasError: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "update:value", value: File[]): void;
}>();

const upload = (files: File[]) => {
  emit("update:value", files);
};
</script>
<style lang="scss" scoped>
.debugger-empty-state-title {
  @apply mb-1 font-sans text-3xl font-bold text-white;
}

.debugger-empty-state-description {
  @apply mb-10 font-sans text-base font-normal text-white;
}
.debugger-empty-upload-file-wrapper {
  @apply flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-md;
  @apply md:min-h-[240px];
  .upload-file {
    @apply w-full overflow-hidden px-2 sm:w-max sm:px-10;
  }

  .error-alert {
    @apply mb-2;
  }
}
.upload-file {
  @apply relative flex items-center justify-center  gap-1 whitespace-pre-line rounded-lg border border-dashed border-neutral-500 bg-neutral-50 py-8 text-base text-sm text-neutral-800 sm:py-12 sm:text-base;

  &.active {
    @apply border-solid bg-neutral-200;
  }
}

.upload-file-icon {
  @apply mr-1.5 h-6 w-6;
}
.upload-file-label {
  @apply cursor-pointer font-medium text-primary-500 underline;
}
</style>
