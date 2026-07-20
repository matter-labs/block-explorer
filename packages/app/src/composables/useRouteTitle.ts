import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import useRuntimeConfig from "@/composables/useRuntimeConfig";

import { shortValue } from "@/utils/formatters";

export default () => {
  const route = useRoute();
  const { t } = useI18n();
  const { brandName } = useRuntimeConfig();

  const title = computed(() => {
    let param = "";
    if (!route.meta.title) {
      return;
    }
    if (route.params.id) {
      param = `#${route.params.id}`;
    } else if (route.params.hash) {
      param = shortValue(`${route.params.hash}`);
    } else if (route.params.address) {
      param = shortValue(`${route.params.address}`);
    }

    return `${t(route.meta.title as string)} ${param ? `${param} ` : ""}| ${t("document.title", { brandName })}`;
  });

  return {
    title,
  };
};
