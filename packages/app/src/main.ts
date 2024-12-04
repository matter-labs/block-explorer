import { computed, createApp } from "vue";
import { createI18n } from "vue-i18n";

import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

import App from "./App.vue";
import useContext from "./composables/useContext";
import { loadEnvironmentConfig } from "./composables/useEnvironmentConfig";
import { default as useWallet } from "./composables/useWallet";
import testId from "./plugins/testId";
import router from "./router";

import useRuntimeConfig from "@/composables/useRuntimeConfig";

import enUS from "./locales/en.json";

import { useSentry } from "@/utils/logger";

import "@/assets/tailwind.scss";

export type MessageSchema = typeof enUS;

const app = createApp(App);
const i18n = createI18n<[MessageSchema], "en">({
  legacy: false,
  fallbackLocale: "en",
  locale: "en",
  allowComposition: true,
  messages: {
    en: enUS,
  },
});

app.use(router);
app.use(i18n);
app.use(testId);
const runtimeConfig = useRuntimeConfig();

const context = useContext();

const { initialize: initializeWallet } = useWallet({
  ...context,
  currentNetwork: computed(() => ({
    explorerUrl: context.currentNetwork.value.rpcUrl,
    chainName: context.currentNetwork.value.l2NetworkName,
    l1ChainId: null as unknown as number,
    ...context.currentNetwork.value,
  })),
});
initializeWallet();

if (runtimeConfig.sentryDSN?.length) {
  useSentry(app, runtimeConfig.sentryDSN, runtimeConfig.appEnvironment, runtimeConfig.version, router);
}

(process.env.NODE_ENV === "test" ? Promise.resolve() : loadEnvironmentConfig(runtimeConfig))
  .catch(() => null)
  .then(context.identifyNetwork);

app.mount("#app");
