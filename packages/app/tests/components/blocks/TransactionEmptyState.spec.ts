import { createI18n } from "vue-i18n";

import { describe, it } from "vitest";

import { render } from "@testing-library/vue";

import TransactionEmptyState from "@/components/blocks/TransactionEmptyState.vue";

import enUS from "@/locales/en.json";

describe("TransactionEmptyState", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("renders component properly for existing block", async () => {
    const { getByText } = render(TransactionEmptyState, {
      global: {
        plugins: [i18n],
      },
      props: {
        blockExists: true,
      },
    });
    getByText("This Block doesn't have any transactions");
  });
  it("renders component properly for nonexisting block", async () => {
    const { getByText } = render(TransactionEmptyState, {
      global: {
        plugins: [i18n],
      },
      props: {
        blockExists: false,
      },
    });
    getByText("This Block has not been created or sealed yet");
  });
});
