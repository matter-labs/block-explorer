import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableAutoUnmount, mount } from "@vue/test-utils";

import enUS from "@/locales/en.json";

import LoginView from "@/views/LoginView.vue";

const routeQuery = ref<Record<string, unknown>>({});
const user = ref({ loggedIn: false });
const loginMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: routeQuery.value }),
}));
vi.mock("@/composables/useContext", () => ({
  default: () => ({ user, currentNetwork: computed(() => ({})) }),
}));
vi.mock("@/composables/useLogin", () => ({
  default: () => ({ login: loginMock, isLoginPending: ref(false) }),
}));
vi.mock("@/composables/useRuntimeConfig", () => ({
  default: () => ({ brandName: "Prividium" }),
}));

describe("LoginView:", () => {
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

  it("does not follow a javascript: redirect once logged in", () => {
    user.value = { loggedIn: true };
    routeQuery.value = { redirect: "javascript:alert(1)" };
    mount(LoginView, { global });

    expect(hrefSetter).toHaveBeenCalledWith("/");
  });

  it("follows a same-origin relative redirect once logged in", () => {
    user.value = { loggedIn: true };
    routeQuery.value = { redirect: "/tx/0xabc?foo=bar#section" };
    mount(LoginView, { global });

    expect(hrefSetter).toHaveBeenCalledWith("/tx/0xabc?foo=bar#section");
  });

  it("does not pass a javascript: redirect to login", async () => {
    user.value = { loggedIn: false };
    routeQuery.value = { redirect: "javascript:alert(1)" };
    await mount(LoginView, { global }).find("button").trigger("click");

    expect(loginMock).toHaveBeenCalledWith(undefined);
  });
});
