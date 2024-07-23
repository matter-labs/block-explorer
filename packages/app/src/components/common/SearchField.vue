<template>
  <div>
    <label class="input-label block font-medium text-sm" v-if="label && label.length" for="search">{{ label }}</label>
    <div class="search-input-container flex items-center relative">
      <input
        class="search-input block border-none leading-none placeholder-gray-2 pl-8 pr-16 py-6 ring-inset rounded-full shadow-soft text-black truncate w-full focus:border-blue focus:ring-blue disabled:cursor-not-allowed disabled:opacity-50"
        id="search"
        type="text"
        name="search"
        spellcheck="false"
        v-model="model"
        :class="{ 'has-error': error && error.length }"
        :disabled="disabled"
        :placeholder="placeholder"
      />
      <div class="spinner-container absolute inset-y-0 right-0 flex py-2.5 pr-2.5" v-if="pending">
        <Spinner />
      </div>
      <div v-else class="submit-icon-container absolute inset-y-0 right-3 flex items-center">
        <slot class="submit-icon" name="submit" />
      </div>
    </div>
    <div class="error-message absolute -bottom-6 left-6 text-error-600 text-xs" v-if="error && error.length">
      {{ t("searchForm.errorMessage") }}
    </div>
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
.search-input-container .has-error {
  @apply border-error-300 text-error-900 placeholder-error-300 ring-error-300 focus:border-error-500 focus:ring-error-500;
}
</style>
