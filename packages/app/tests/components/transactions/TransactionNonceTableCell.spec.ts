import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";
import { mount } from "@vue/test-utils";

import TransactionNonceTableCell from "@/components/transactions/TransactionNonceTableCell.vue";

import enUS from "@/locales/en.json";

describe("TransactionNonceTableCell:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  it("shows info icon when transaction direction value is 'in'", () => {
    const container = mount(TransactionNonceTableCell, {
      props: {
        nonce: 10,
        direction: "in",
        showInfo: true,
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.find(".nonce-info-icon")).toBeDefined();
    expect(container.find(".transactions-data-transaction-nonce").text()).toBe("10");
  });
  it("hides info icon when 'nonce-info' is equal to false", () => {
    const { container } = render(TransactionNonceTableCell, {
      props: {
        nonce: 10,
        direction: "in",
        showInfo: false,
      },
      global: {
        plugins: [i18n],
      },
    });
    expect(container.querySelector(".nonce-info-icon")).toBeNull();
  });
});
