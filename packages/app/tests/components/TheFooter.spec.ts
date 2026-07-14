import { createI18n } from "vue-i18n";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import TheFooter from "@/components/TheFooter.vue";

import enUS from "@/locales/en.json";

const runtimeConfigMock = {
  version: "localhost",
  links: {
    docsUrl: "https://docs.zksync.io/zksync-network/tooling/block-explorers" as string | null,
    termsOfServiceUrl: "https://zksync.io/terms" as string | null,
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

  beforeEach(() => {
    runtimeConfigMock.links.docsUrl = "https://docs.zksync.io/zksync-network/tooling/block-explorers";
    runtimeConfigMock.links.termsOfServiceUrl = "https://zksync.io/terms";
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

  it("hides the docs link when no docs URL is resolved", () => {
    runtimeConfigMock.links.docsUrl = null;
    const links = mountFooter().findAll("a");
    expect(links).toHaveLength(2);
    expect(links[0].attributes("href")).toBe("https://zksync.io/terms");
  });

  it("hides the terms link when no terms URL is resolved", () => {
    runtimeConfigMock.links.termsOfServiceUrl = null;
    const links = mountFooter().findAll("a");
    expect(links).toHaveLength(2);
    expect(links[1].attributes("href")).toBe("https://zksync.io/contact");
  });

  it("renders no links when all URLs are hidden", () => {
    runtimeConfigMock.links.docsUrl = null;
    runtimeConfigMock.links.termsOfServiceUrl = null;
    runtimeConfigMock.links.contactUsUrl = null;
    expect(mountFooter().findAll("a")).toHaveLength(0);
  });
});
