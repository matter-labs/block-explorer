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
  it("renders component properly for existing batch", async () => {
    const { getByText } = render(TransactionEmptyState, {
      global: {
        plugins: [i18n],
      },
      props: {
        batchExists: true,
      },
    });
    getByText("This Batch doesn't have any transactions");
  });
  it("renders component properly for nonexisting batch", async () => {
    const { getByText } = render(TransactionEmptyState, {
      global: {
        plugins: [i18n],
      },
      props: {
        batchExists: false,
      },
    });
    getByText("This Batch has not been created or sealed yet");
  });
});
