import { useI18n } from "vue-i18n";

import { useStorage } from "@vueuse/core";

export default (i18n = useI18n({ useScope: "global" }), storage = useStorage("language", "en")) => {
  const setup = () => {
    return changeLanguage(storage.value);
  };

  const changeLanguage = async (value: string) => {
    if (i18n.availableLocales.indexOf(value) === -1) {
      const messages = await import(`./../locales/${value}.json`);
      i18n.setLocaleMessage(value, messages);
    }
    storage.value = value;
    i18n.locale.value = value;
    document.querySelector("html")!.setAttribute("lang", value);
  };

  return { setup, changeLanguage };
};
