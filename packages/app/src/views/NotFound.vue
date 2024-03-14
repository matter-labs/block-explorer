<template>
  <div class="not-found">
    <SearchIcon class="search-icon"></SearchIcon>
    <h1 class="header">{{ t("notFound.title") }}</h1>
    <p class="description">
      {{ t("notFound.description") }}
    </p>
    <SearchForm class="search-form"></SearchForm>
    <div class="contact-support">
      {{ t("notFound.contactSupportTitle") }}
      <a href="https://zulunetwork.io/" target="_blank">{{ t("notFound.contactSupport") }}</a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

import { SearchIcon } from "@heroicons/vue/outline";

import SearchForm from "@/components/SearchForm.vue";

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.not-found {
  @apply flex min-h-[calc(100vh-260px)] flex-col items-center justify-center text-center;
  .search-icon {
    @apply my-12 w-24 rounded-lg bg-white p-4 text-neutral-800;
  }

  .header {
    @apply mb-4 text-3xl text-neutral-800 sm:text-4xl;
  }

  .description {
    @apply mb-6 max-w-xl text-xl leading-6 text-neutral-500 sm:text-2xl;
  }

  .search-form {
    @apply mb-7 w-full max-w-screen-sm;
  }

  .contact-support {
    @apply text-base text-neutral-500;
  }
}
</style>
