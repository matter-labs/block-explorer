import { createI18n } from "vue-i18n";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import TheFooter from "@/components/TheFooter.vue";

import enUS from "@/locales/en.json";

const runtimeConfigMock = {
  version: "localhost",
  links: {
    docsUrl: "https://docs.zksync.io/zksync-network/tooling/block-explorers",
    termsOfServiceUrl: "https://zksync.io/terms",
    contactUsUrl: "https://zksync.io/contact" as string | null,
  },
};
vi.mock("@/composables/useRuntimeConfig", () => ({
  default: () => runtimeConfigMock,
}));

describe("TheFooter:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  const mountFooter = () => mount(TheFooter, { global: { plugins: [i18n] } });
  const contactLink = (wrapper: ReturnType<typeof mountFooter>) =>
    wrapper.findAll("a").find((a) => a.attributes("href") === runtimeConfigMock.links.contactUsUrl);

  beforeEach(() => {
    runtimeConfigMock.links.contactUsUrl = "https://zksync.io/contact";
  });

  it("renders navigation links", () => {
    const links = mountFooter().findAll("a");
    expect(links[0].attributes("href")).toBe("https://docs.zksync.io/zksync-network/tooling/block-explorers");
    expect(links[1].attributes("href")).toBe("https://zksync.io/terms");
    expect(links[2].attributes("href")).toBe("https://zksync.io/contact");
  });

  it("hides the contact link when no contact URL is resolved", () => {
    runtimeConfigMock.links.contactUsUrl = null;
    expect(mountFooter().findAll("a")).toHaveLength(2);
  });

  it("shows the operator contact link when configured", () => {
    runtimeConfigMock.links.contactUsUrl = "https://bank-xyz.example/support";
    expect(contactLink(mountFooter())?.attributes("href")).toBe("https://bank-xyz.example/support");
  });
});
