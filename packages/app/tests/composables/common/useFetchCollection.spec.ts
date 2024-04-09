import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import composable, { type UseFetchCollection } from "@/composables/common/useFetchCollection";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => null),
  };
});

describe("useFetchCollection:", () => {
  afterEach(() => {
    ($fetch as unknown as SpyInstance).mockReset();
  });
  it("creates useFetchCollection composable", () => {
    const result = composable(new URL("https://block-explorer-api.testnets.zksync.dev"));
    expect(result.pending).toBeDefined();
    expect(result.failed).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.page).toBeDefined();
    expect(result.pageSize).toBeDefined();
    expect(result.load).toBeDefined();
  });
  describe("estimate", () => {
    let fc: UseFetchCollection<string>;
    beforeEach(() => {
      fc = composable(new URL("https://block-explorer-api.testnets.zksync.dev"));
    });

    it("sets pending to true when request is pending", async () => {
      const promise = fc.load(1);
      expect(fc.pending.value).toEqual(true);
      await promise;
    });

    it("sets pending to false when request is completed", async () => {
      await fc.load(1);

      expect(fc.pending.value).toEqual(false);
    });

    it("sets failed to true when request failed", async () => {
      ($fetch as unknown as SpyInstance).mockRejectedValue(new Error("500"));

      await fc.load(1);
      expect(fc.failed.value).toEqual(true);
    });

    it("sets corresponding data when request is completed", async () => {
      ($fetch as unknown as SpyInstance).mockResolvedValue({
        items: [{}, {}],
        meta: {},
      });
      await fc.load(1);

      expect(fc.data.value).toHaveLength(2);
    });

    it("maps and sets corresponding data when item mapper is specified and request is completed", async () => {
      fc = composable(new URL("https://block-explorer-api.testnets.zksync.dev"), (item) => `mapped ${item}`);
      ($fetch as unknown as SpyInstance).mockResolvedValue({
        items: ["item1", "item2"],
        meta: {},
      });
      await fc.load(1);
      expect(fc.data.value).toEqual(["mapped item1", "mapped item2"]);
    });

    it("sets total when request is completed", async () => {
      ($fetch as unknown as SpyInstance).mockResolvedValue({
        items: [{}, {}],
        meta: {
          totalItems: 11,
        },
      });
      await fc.load(1);

      expect(fc.total.value).toEqual(11);
    });

    it("sets page when request is completed", async () => {
      ($fetch as unknown as SpyInstance).mockResolvedValue({
        items: [{}, {}],
        meta: {
          currentPage: 5,
        },
      });
      await fc.load(5);

      expect(fc.page.value).toEqual(5);
    });

    it("sets 10 for pageSize", async () => {
      ($fetch as unknown as SpyInstance).mockResolvedValue({
        items: [{}, {}],
        meta: {},
      });
      await fc.load(1);

      expect(fc.pageSize.value).toEqual(10);
    });

    it("sets toDate to query string when param specified", async () => {
      ($fetch as unknown as SpyInstance).mockResolvedValue({
        items: [{}, {}],
        meta: {},
      });
      await fc.load(1, new Date("2023-05-01T10:00:00.000Z"));

      expect($fetch).toHaveBeenCalledWith(
        "https://block-explorer-api.testnets.zksync.dev/?pageSize=10&page=1&toDate=2023-05-01T10%3A00%3A00.000Z"
      );
    });
  });
});
