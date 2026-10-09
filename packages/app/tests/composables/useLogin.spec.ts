import { computed, ref } from "vue";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import useLogin from "@/composables/useLogin";

import type { Context } from "@/composables/useContext";
import type { SpyInstance } from "vitest";

vi.mock("ohmyfetch", () => {
  const fetchSpy = vi.fn();
  (fetchSpy as unknown as { create: SpyInstance }).create = vi.fn(() => fetchSpy);
  class FetchError extends Error {
    response?: { status: number };
  }
  return { $fetch: fetchSpy, FetchError };
});

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const fetchSpy = $fetch as unknown as SpyInstance;
const logger = { error: vi.fn(), warn: vi.fn(), log: vi.fn() };

const failWith = (status?: number) => {
  const error = new FetchError("request failed");
  if (status !== undefined) {
    error.response = { status } as never;
  }
  return error;
};

describe("useLogin", () => {
  let context: Context;

  beforeEach(() => {
    fetchSpy.mockReset();
    context = {
      currentNetwork: computed(() => ({ prividium: true, apiUrl: "http://api.url" })),
      user: ref({ loggedIn: false }),
    } as unknown as Context;
  });

  describe("initializeLogin", () => {
    it("stores the session returned by the API", async () => {
      fetchSpy.mockResolvedValueOnce({
        address: "0x1",
        wallets: ["0x1"],
        hasFullReadAccess: true,
        hasAdminRead: false,
      });

      await useLogin(context, logger).initializeLogin();

      expect(context.user.value).toEqual({
        address: "0x1",
        wallets: ["0x1"],
        hasFullReadAccess: true,
        hasAdminRead: false,
        loggedIn: true,
      });
    });

    it.each([401, 403])("logs out when the API rejects the session with %i", async (status) => {
      fetchSpy.mockRejectedValueOnce(failWith(status)).mockResolvedValueOnce(undefined);

      await useLogin(context, logger).initializeLogin();

      expect(fetchSpy).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
      expect(context.user.value).toEqual({ loggedIn: false });
    });

    it.each([502, 429, undefined])(
      "keeps the cookie when the session check fails transiently (status %s)",
      async (status) => {
        fetchSpy.mockRejectedValueOnce(failWith(status));

        await useLogin(context, logger).initializeLogin();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).not.toHaveBeenCalledWith("/auth/logout", expect.anything());
        expect(context.user.value).toEqual({ loggedIn: false });
      }
    );
  });
});
