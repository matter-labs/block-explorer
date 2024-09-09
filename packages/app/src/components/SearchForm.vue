<template>
  <form class="search-form" autocomplete="off" @submit.prevent="submit">
    <search-field
      v-model:value="searchValue"
      :placeholder="t('searchForm.placeholder')"
      :error="
        v$.searchValue.$error ? v$.searchValue.$errors[0] && v$.searchValue.$errors[0].$message.toString() : undefined
      "
      :pending="isRequestPending"
    >
      <template #submit>
        <button
          class="submit-icon flex aspect-square h-12 items-center justify-center rounded-full bg-blue text-center text-lg text-white"
          type="submit"
        >
          <svg class="inline-block h-[1em] w-[1em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M9.6 2.4a7.2 7.2 0 1 0 0 14.4 7.2 7.2 0 0 0 0-14.4Zm-6.79.41A9.6 9.6 0 0 1 17.18 15.5l6.47 6.46a1.2 1.2 0 0 1-1.7 1.7l-6.46-6.47A9.6 9.6 0 0 1 2.8 2.81Z"
            />
          </svg>
        </button>
      </template>
    </search-field>
  </form>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useVuelidate } from "@vuelidate/core";
import { or } from "@vuelidate/validators";

import SearchField from "@/components/common/SearchField.vue";

import useSearch from "@/composables/useSearch";

import { isAddress, isBlockNumber, isTransactionHash } from "@/utils/validators";

const searchValue = ref("");
const { search, isRequestPending } = useSearch();
const { t } = useI18n();

const v$ = useVuelidate(
  {
    searchValue: {
      isSearchable: or(isBlockNumber, isAddress, isTransactionHash),
    },
  },
  { searchValue },
  { $stopPropagation: true }
);

const submit = async () => {
  const validationResult = await v$.value.$validate();
  if (!validationResult) {
    return;
  }
  await search(searchValue.value);
};
</script>

<style lang="scss" scoped>
.submit-icon svg {
  height: 1em;
  width: 1em;
}

.submit-icon-container {
  &:hover:not(:active) {
    .submit-icon {
      @apply bg-blue;
    }
  }

  &:active {
    .submit-icon {
      @apply transition-none;
    }
  }
}
</style>
