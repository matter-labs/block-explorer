import elements from "../../tests/e2e/testId.json";

import type { App } from "vue";

declare module "vue" {
  interface ComponentCustomProperties {
    $testId: typeof elements;
  }
}

export default {
  install: (app: App) => {
    app.config.globalProperties.$testId = elements;
  },
};

export {};
