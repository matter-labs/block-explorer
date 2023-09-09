import { createI18n } from "vue-i18n";

import { describe, it } from "vitest";

import { render } from "@testing-library/vue";

import TransactionEmptyState from "@/components/batches/TransactionEmptyState.vue";

import enUS from "@/locales/en.json";

describe("TransactionEmptyState", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders component properly", async () => {
    const { getByText } = render(TransactionEmptyState, {
      global: {
        plugins: [i18n],
      },
    });
    getByText("This Batch doesn't have any transactions");
    getByText("We can't find transactions for this batch We'll fix it in a moment; please refresh the page");
  });
});
