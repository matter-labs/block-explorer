import { createI18n } from "vue-i18n";

import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import TheFooter from "@/components/TheFooter.vue";

import enUS from "@/locales/en.json";

describe("TheFooter:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  it("renders navigation links", () => {
    const wrapper = mount(TheFooter, {
      global: {
        plugins: [i18n],
      },
    });
    const links = wrapper.findAll("a");
    expect(links[0].attributes("href")).toBe("https://docs.zksync.io/zksync-network/tooling/block-explorers");
    expect(links[1].attributes("href")).toBe("https://zksync.io/terms");
    expect(links[2].attributes("href")).toBe("https://zksync.io/contact");
  });
});
