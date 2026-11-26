import { computed, ref } from "vue";

import { beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { FetchInstance } from "@/composables/useFetchInstance";

import type { Context } from "@/composables/useContext";

vi.mock("ohmyfetch", () => {
  const instance: { create: SpyInstance } = { create: vi.fn(() => instance) };
  return { $fetch: instance };
});

const buildContext = (prividium: boolean) =>
  ({
    currentNetwork: computed(() => ({
      apiUrl: "https://api.example.com",
      verificationApiUrl: "https://api.example.com/api",
      prividium,
    })),
    user: ref({ loggedIn: true }),
  } as unknown as Context);

describe("FetchInstance:", () => {
  const create = ($fetch as unknown as { create: SpyInstance }).create;

  beforeEach(() => {
    create.mockClear();
  });

  describe("verificationApi:", () => {
    it("sends the session cookie in Prividium mode", () => {
      FetchInstance.verificationApi(buildContext(true));

      expect(create).toHaveBeenCalledWith({ baseURL: "https://api.example.com/api" });
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ credentials: "include" }));
    });

    it("does not send cookies outside Prividium mode", () => {
      FetchInstance.verificationApi(buildContext(false));

      expect(create).toHaveBeenCalledWith({ baseURL: "https://api.example.com/api" });
      expect(create).not.toHaveBeenCalledWith(expect.objectContaining({ credentials: "include" }));
    });

    it("sends the user to the login page when the API invalidates the session in Prividium mode", () => {
      const context = buildContext(true);
      FetchInstance.verificationApi(context);
      const [{ onResponse }] = create.mock.calls.find(([options]) => options.credentials === "include") ?? [{}];

      const location = window.location;
      Object.defineProperty(window, "location", { value: { href: "", pathname: "/contracts/verify" }, writable: true });
      try {
        onResponse({ response: { status: 401 } });

        expect(context.user.value).toEqual({ loggedIn: false });
        expect(window.location.href).toBe("/login?redirect=%2Fcontracts%2Fverify");
      } finally {
        Object.defineProperty(window, "location", { value: location, writable: true });
      }
    });
  });
});
