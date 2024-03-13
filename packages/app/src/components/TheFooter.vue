<template>
  <footer>
    <div class="footer-container">
      <div class="links-container">
        <a v-for="item in navigation" :key="item.label" :href="item.url" target="_blank" rel="noopener">
          {{ item.label }}
        </a>
      </div>
      <div class="version-text-container text-sm">
        <p>&copy; 2024 Zulu Network All Rights Reserved</p>
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
    // url: "https://docs.zksync.io/build/tooling/block-explorer/getting-started.html",// TODO write docs later
    url: "https://docs.zulunetwork.io/introduction/welcome-to-zulu",
  },
  {
    label: computed(() => t("footer.nav.terms")),
    url: "https://zulunetwork.io",
  },
  {
    label: computed(() => t("footer.nav.contact")),
    url: "https://docs.zulunetwork.io/support-and-community/join-the-community",
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
