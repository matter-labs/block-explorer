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
          class="submit-icon aspect-square bg-blue flex h-12 items-center justify-center rounded-full text-center text-white text-2xl"
          type="submit"
        >
          <SearchIcon aria-hidden="true" />
        </button>
      </template>
    </search-field>
  </form>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { SearchIcon } from "@heroicons/vue/outline";
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
