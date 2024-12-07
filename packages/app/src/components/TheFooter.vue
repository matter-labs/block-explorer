<template>
  <footer>
    <div class="footer-container">
      <div class="links-container">
        <a v-for="item in navigation" :key="item.label" :href="item.url" target="_blank" rel="noopener">
          {{ item.label }}
        </a>
      </div>
      <div class="version-text-container">
        <p>{{ config.version }}</p>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import { computed, reactive } from "vue";
import { useI18n } from "vue-i18n";

import useRuntimeConfig from "@/composables/useRuntimeConfig";
const { t } = useI18n();
const config = useRuntimeConfig();

const navigation = reactive([
  {
    label: computed(() => t("footer.nav.docs")),
    url: "https://docs.treasure.lol",
  },
  {
    label: computed(() => t("footer.nav.terms")),
    url: "https://treasure.lol/terms-of-service",
  },
]);
</script>

<style scoped lang="scss">
.footer-container {
  @apply container py-12 text-silver-500 md:flex md:items-center md:justify-between;

  .links-container {
    @apply flex justify-center space-x-6 md:order-1;

    a {
      @apply text-silver-500 no-underline;
    }
  }
  .version-text-container {
    @apply mt-8 text-center md:order-2 md:mt-0;
  }
}
</style>
