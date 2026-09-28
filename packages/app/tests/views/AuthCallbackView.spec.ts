import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import AuthCallbackView from "@/views/AuthCallbackView.vue";

const routeQuery = ref<Record<string, unknown>>({});
const routerPushMock = vi.fn();
const handlePrividiumCallbackMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: routerPushMock }),
  useRoute: () => ({ query: routeQuery.value }),
}));

vi.mock("@/composables/useContext", () => ({
  default: () => ({
    currentNetwork: computed(() => ({ logoUrl: "/images/prividium_logo.svg" })),
  }),
}));

vi.mock("@/composables/useLogin", () => ({
  default: () => ({ handlePrividiumCallback: handlePrividiumCallbackMock }),
}));

const maliciousRedirects = [
  "javascript:window.__xss__=true",
  "https://phishing.example/harvest",
  "//phishing.example/harvest",
  "/\\phishing.example",
];

describe("AuthCallbackView:", () => {
  enableAutoUnmount(afterEach);

  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });
  const global = {
    stubs: ["router-link"],
    plugins: [i18n, $testId],
  };

  const originalLocation = window.location;
  const hrefSetter = vi.fn();

  beforeEach(() => {
    hrefSetter.mockReset();
    routerPushMock.mockReset();
    handlePrividiumCallbackMock.mockReset();
    routeQuery.value = {};
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        origin: originalLocation.origin,
        set href(value: string) {
          hrefSetter(value);
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it.each(maliciousRedirects)("does not follow stored redirect %j and falls back to the app root", async (redirect) => {
    handlePrividiumCallbackMock.mockResolvedValue({ redirect });
    mount(AuthCallbackView, { global });
    await flushPromises();

    expect(hrefSetter).toHaveBeenCalledTimes(1);
    expect(hrefSetter).toHaveBeenCalledWith("/");
  });

  it("follows a stored same-origin relative redirect", async () => {
    handlePrividiumCallbackMock.mockResolvedValue({ redirect: "/tx/0xabc?foo=bar#section" });
    mount(AuthCallbackView, { global });
    await flushPromises();

    expect(hrefSetter).toHaveBeenCalledWith("/tx/0xabc?foo=bar#section");
  });

  it("falls back to the app root when no redirect was stored", async () => {
    handlePrividiumCallbackMock.mockResolvedValue({ redirect: null });
    mount(AuthCallbackView, { global });
    await flushPromises();

    expect(hrefSetter).toHaveBeenCalledWith("/");
  });

  it("drops a malicious redirect query when retrying login", async () => {
    routeQuery.value = { redirect: "javascript:window.__xss__=true" };
    handlePrividiumCallbackMock.mockRejectedValue(new Error("boom"));
    const wrapper = mount(AuthCallbackView, { global });
    await flushPromises();
    await wrapper.find("button").trigger("click");

    expect(routerPushMock).toHaveBeenCalledWith({ name: "login", query: undefined });
  });

  it("keeps a same-origin relative redirect query when retrying login", async () => {
    routeQuery.value = { redirect: "/tx/0xabc" };
    handlePrividiumCallbackMock.mockRejectedValue(new Error("boom"));
    const wrapper = mount(AuthCallbackView, { global });
    await flushPromises();
    await wrapper.find("button").trigger("click");

    expect(routerPushMock).toHaveBeenCalledWith({ name: "login", query: { redirect: "/tx/0xabc" } });
  });
});
