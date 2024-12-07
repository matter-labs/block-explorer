<template>
  <div>
    <label v-if="label && label.length" for="search" class="input-label">{{ label }}</label>
    <div class="search-input-container">
      <input
        id="search"
        v-model="model"
        :placeholder="placeholder"
        type="text"
        :disabled="disabled"
        name="search"
        class="search-input"
        :class="{ 'has-error': error && error.length }"
        spellcheck="false"
      />
      <div v-if="pending" class="spinner-container">
        <Spinner />
      </div>
      <div v-else class="submit-icon-container">
        <slot class="submit-icon" name="submit" />
      </div>
    </div>
    <div class="error-message" v-if="error && error.length">{{ t("searchForm.errorMessage") }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import Spinner from "@/components/common/Spinner.vue";

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  pending: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
});
const { t } = useI18n();
const emit = defineEmits(["update:value"]);
const model = computed({
  get: () => props.value,
  set: (value: string) => {
    emit("update:value", value.trim());
  },
});
</script>

<style scoped lang="scss">
.input-label {
  @apply block text-sm font-medium text-cream;
}
.search-icon-container {
  @apply pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3;
  .search-icon {
    @apply z-10 h-5 w-5 text-cream;
  }
}
.error-message {
  @apply absolute -bottom-5 text-xs text-ruby-600 lg:-bottom-7 lg:text-sm;
}
.search-input-container {
  @apply relative flex items-center;
  .search-input {
    @apply bg-night-700/50 block w-full truncate rounded-md border border-night-500 py-3 pl-4 pr-16 leading-5 text-cream placeholder-neutral-400 ring-inset placeholder:text-sm focus:border-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm;
  }
  .has-error {
    @apply border-ruby-300 text-ruby-500 placeholder-ruby-200 ring-ruby-200 focus:border-ruby-300 focus:ring-error-300;
  }
}
.submit-icon-container {
  @apply ml-2 rounded-md flex items-center;
}
.spinner-container {
  @apply absolute inset-y-0 right-0 flex py-2.5 pr-2.5;
}
</style>
