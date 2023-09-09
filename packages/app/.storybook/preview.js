import "../src/assets/tailwind.scss";
import { createI18n } from "vue-i18n";
import enUS from "../src/locales/en.json";
import { app } from '@storybook/vue3'
import $testId from "../src/plugins/testId";

app.component('RouterLink', {
  template: `<a v-bind="$props" href="#"><slot /></a>`
});

const i18n = createI18n({
  locale: "en",
  allowComposition: true,
  messages: {
    en: enUS,
  },
});
app.use(i18n)
app.use($testId)

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}
