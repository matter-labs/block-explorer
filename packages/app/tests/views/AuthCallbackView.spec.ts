import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";

import enUS from "@/locales/en.json";

import AuthCallbackView from "@/views/AuthCallbackView.vue";

const handlePrividiumCallbackMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
}));
vi.mock("@/composables/useContext", () => ({
  default: () => ({ currentNetwork: computed(() => ({})) }),
}));
vi.mock("@/composables/useLogin", () => ({
  default: () => ({ handlePrividiumCallback: handlePrividiumCallbackMock }),
}));

describe("AuthCallbackView:", () => {
  enableAutoUnmount(afterEach);

  const global = { plugins: [createI18n({ locale: "en", allowComposition: true, messages: { en: enUS } })] };
  const originalLocation = window.location;
  const hrefSetter = vi.fn();

  beforeEach(() => {
    hrefSetter.mockReset();
    const location = Object.defineProperty({ origin: originalLocation.origin }, "href", { set: hrefSetter });
    Object.defineProperty(window, "location", { configurable: true, value: location });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("does not follow a stored javascript: redirect", async () => {
    handlePrividiumCallbackMock.mockResolvedValue({ redirect: "javascript:alert(1)" });
    mount(AuthCallbackView, { global });
    await flushPromises();

    expect(hrefSetter).toHaveBeenCalledWith("/");
  });

  it("follows a stored same-origin relative redirect", async () => {
    handlePrividiumCallbackMock.mockResolvedValue({ redirect: "/tx/0xabc?foo=bar#section" });
    mount(AuthCallbackView, { global });
    await flushPromises();

    expect(hrefSetter).toHaveBeenCalledWith("/tx/0xabc?foo=bar#section");
  });
});
