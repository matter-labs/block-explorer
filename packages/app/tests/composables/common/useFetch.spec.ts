import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import composable, { type UseFetch } from "@/composables/common/useFetch";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => null),
  };
});

describe("useFetch:", () => {
  afterEach(() => {
    ($fetch as unknown as SpyInstance).mockReset();
  });
  it("creates useFetch composable", () => {
    const result = composable(() => new URL("https://block-explorer-api.testnets.zksync.dev"));
    expect(result.pending).toBeDefined();
    expect(result.failed).toBeDefined();
    expect(result.item).toBeDefined();
    expect(result.fetch).toBeDefined();
  });
  describe("estimate", () => {
    let fc: UseFetch<string>;
    beforeEach(() => {
      fc = composable(() => new URL("https://block-explorer-api.testnets.zksync.dev"));
    });

    it("sets pending to true when request is pending", async () => {
      const promise = fc.fetch();
      expect(fc.pending.value).toEqual(true);
      await promise;
    });

    it("sets pending to false when request is completed", async () => {
      await fc.fetch();

      expect(fc.pending.value).toEqual(false);
    });

    it("sets failed to true when request failed", async () => {
      ($fetch as unknown as SpyInstance).mockRejectedValue(new Error("500"));

      await fc.fetch();
      expect(fc.failed.value).toEqual(true);
    });

    it("sets corresponding item when request is completed", async () => {
      ($fetch as unknown as SpyInstance).mockResolvedValue("2");
      await fc.fetch();

      expect(fc.item.value).toEqual("2");
    });

    it("uses provided url", async () => {
      fc = composable(() => new URL("https://block-explorer-api.testnets.zksync.dev/?a=b"));

      await fc.fetch();

      expect($fetch).toHaveBeenCalledWith("https://block-explorer-api.testnets.zksync.dev/?a=b");
    });
  });
});
