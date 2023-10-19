import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import PaymasterLabel from "@/components/transactions/PaymasterLabel.vue";

import enUS from "@/locales/en.json";

describe("TransactionNetworkSquareBlock:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  const global = {
    plugins: [i18n],
  };

  it("renders component", () => {
    const wrapper = mount(PaymasterLabel, {
      global,
    });
    expect(wrapper.find(".paymaster-label").text()).toBe("Paymaster");
  });
});
