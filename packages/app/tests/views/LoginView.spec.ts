import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableAutoUnmount, mount } from "@vue/test-utils";

import enUS from "@/locales/en.json";

import $testId from "@/plugins/testId";
import LoginView from "@/views/LoginView.vue";

const routeQuery = ref<Record<string, unknown>>({});
const user = ref<{ loggedIn: boolean }>({ loggedIn: false });
const loginMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: routeQuery.value }),
}));

vi.mock("@/composables/useContext", () => ({
  default: () => ({
    user,
    currentNetwork: computed(() => ({ logoUrl: "/images/prividium_logo.svg" })),
  }),
}));

vi.mock("@/composables/useLogin", () => ({
  default: () => ({ login: loginMock, isLoginPending: ref(false) }),
}));

vi.mock("@/composables/useRuntimeConfig", () => ({
  default: () => ({ brandName: "Prividium" }),
}));

const maliciousRedirects = [
  "javascript:window.__xss__=true",
  "https://phishing.example/harvest",
  "//phishing.example/harvest",
  "/\\phishing.example",
];

describe("LoginView:", () => {
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
    loginMock.mockReset();
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

  describe("when the user is logged in", () => {
    beforeEach(() => {
      user.value = { loggedIn: true };
    });

    it.each(maliciousRedirects)("does not follow redirect %j and falls back to the app root", (redirect) => {
      routeQuery.value = { redirect };
      mount(LoginView, { global });

      expect(hrefSetter).toHaveBeenCalledTimes(1);
      expect(hrefSetter).toHaveBeenCalledWith("/");
    });

    it("follows a same-origin relative redirect", () => {
      routeQuery.value = { redirect: "/tx/0xabc?foo=bar#section" };
      mount(LoginView, { global });

      expect(hrefSetter).toHaveBeenCalledWith("/tx/0xabc?foo=bar#section");
    });
  });

  describe("when the user is not logged in", () => {
    beforeEach(() => {
      user.value = { loggedIn: false };
    });

    it.each(maliciousRedirects)("does not pass redirect %j to login", async (redirect) => {
      routeQuery.value = { redirect };
      const wrapper = mount(LoginView, { global });
      await wrapper.find("button").trigger("click");

      expect(hrefSetter).not.toHaveBeenCalled();
      expect(loginMock).toHaveBeenCalledWith(undefined);
    });

    it("passes a same-origin relative redirect to login", async () => {
      routeQuery.value = { redirect: "/tx/0xabc" };
      const wrapper = mount(LoginView, { global });
      await wrapper.find("button").trigger("click");

      expect(loginMock).toHaveBeenCalledWith("/tx/0xabc");
    });
  });
});
