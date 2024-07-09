<template>
  <footer>
    <div class="footer-container">
      <div class="links-container">
        <a v-for="item in navigation" :key="item.label" :href="item.url" target="_blank" rel="noopener">
          {{ item.label }}
        </a>
      </div>
      <div class="version-text-container">
        <!-- <p>{{ config.version }}</p> -->
        <p>0.1.0</p>
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
    url: "https://docs.zksync.io/build/tooling/block-explorer/getting-started.html",
  },
  {
    label: computed(() => t("footer.nav.terms")),
    url: "https://farm.sophon.xyz/terms.html",
  },
  {
    label: computed(() => t("footer.nav.contact")),
    url: "https://x.com/sophon",
  },
]);
</script>

<style scoped lang="scss">
.footer-container {
  @apply container py-12 text-neutral-400 md:flex md:items-center md:justify-between;

  .links-container {
    @apply flex justify-center space-x-6 md:order-1;

    a {
      @apply text-neutral-400 no-underline;
    }
  }
  .version-text-container {
    @apply mt-8 text-center md:order-2 md:mt-0;
  }
}
</style>
