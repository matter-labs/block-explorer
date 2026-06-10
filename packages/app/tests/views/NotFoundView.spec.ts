import { createI18n } from "vue-i18n";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import NotFound from "@/views/NotFound.vue";

// SearchForm reaches into useContext / useSearch, so stub it out for this view test.
vi.mock("@/components/SearchForm.vue", () => ({
  default: { template: '<div data-testid="search-form-stub"></div>' },
}));

const runtimeConfigMock = {
  links: {
    contactUsUrl: "https://zksync.io/contact" as string | null,
  },
};
vi.mock("@/composables/useRuntimeConfig", () => ({
  default: () => runtimeConfigMock,
}));

function render() {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: { en: enUS },
  });
  return mount(NotFound, { global: { plugins: [i18n, $testId] } });
}

describe("NotFound view", () => {
  beforeEach(() => {
    runtimeConfigMock.links.contactUsUrl = "https://zksync.io/contact";
  });

  it("shows the contact link when a contact URL is resolved", () => {
    const wrapper = render();
    expect(wrapper.find(".contact-support").exists()).toBe(true);
    expect(wrapper.find(".contact-support a").attributes("href")).toBe("https://zksync.io/contact");
  });

  it("hides the contact link when no contact URL is resolved", () => {
    runtimeConfigMock.links.contactUsUrl = null;
    expect(render().find(".contact-support").exists()).toBe(false);
  });

  it("shows the operator contact link when configured", () => {
    runtimeConfigMock.links.contactUsUrl = "https://bank-xyz.example/support";
    const wrapper = render();
    expect(wrapper.find(".contact-support").exists()).toBe(true);
    expect(wrapper.find(".contact-support a").attributes("href")).toBe("https://bank-xyz.example/support");
  });
});
