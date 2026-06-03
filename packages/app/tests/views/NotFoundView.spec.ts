import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import NotFound from "@/views/NotFound.vue";

// SearchForm reaches into useContext / useSearch — stub it out for this view test.
vi.mock("@/components/SearchForm.vue", () => ({
  default: { template: '<div data-testid="search-form-stub"></div>' },
}));

const runtimeConfigMock = { appEnvironment: "default" as "default" | "prividium" };
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
  it("renders the default copy when appEnvironment is not prividium", () => {
    runtimeConfigMock.appEnvironment = "default";
    const wrapper = render();
    expect(wrapper.find(".header").text()).toBe(enUS.notFound.title);
    expect(wrapper.find(".description").text()).toBe(enUS.notFound.description);
  });

  it("renders the prividium copy when appEnvironment is prividium", () => {
    runtimeConfigMock.appEnvironment = "prividium";
    const wrapper = render();
    expect(wrapper.find(".header").text()).toBe(enUS.notFound.prividiumTitle);
    expect(wrapper.find(".description").text()).toBe(enUS.notFound.prividiumDescription);
  });
});
