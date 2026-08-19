import { computed } from "vue";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { useContextMock } from "./../mocks";

import useTokenOverview from "@/composables/useTokenOverview";

const tokenAddress = "0x000000000000000000000000000000000000800A";

const totalSupplyMock = vi.fn(() => Promise.resolve(BigInt("500000000000000000")));
vi.mock("ethers", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("ethers");
  return {
    ...actual,
    Contract: vi.fn(() => ({ totalSupply: totalSupplyMock })),
  };
});

describe("useTokenOverview:", () => {
  let mockContext: SpyInstance;

  afterEach(() => {
    mockContext?.mockRestore();
    totalSupplyMock.mockClear();
  });

  describe("when a user is logged in", () => {
    beforeEach(() => {
      mockContext = useContextMock();
    });

    it("reads the supply as that user", async () => {
      const { getTokenOverview, tokenOverview } = useTokenOverview();
      await getTokenOverview(tokenAddress);

      expect(totalSupplyMock).toBeCalledWith({ from: "0x000000000000000000000000000000000000800A" });
      expect(tokenOverview.value).toEqual({ totalSupply: BigInt("500000000000000000") });
    });
  });

  describe("when there is no logged in user", () => {
    beforeEach(() => {
      mockContext = useContextMock({ user: computed(() => ({ loggedIn: false })) });
    });

    it("reads the supply without a from address", async () => {
      const { getTokenOverview, tokenOverview } = useTokenOverview();
      await getTokenOverview(tokenAddress);

      expect(totalSupplyMock).toBeCalledWith({});
      expect(tokenOverview.value).toEqual({ totalSupply: BigInt("500000000000000000") });
    });
  });

  describe("when the call is rejected", () => {
    beforeEach(() => {
      mockContext = useContextMock();
      totalSupplyMock.mockRejectedValueOnce(new Error("Permission check for method call returned false"));
    });

    it("marks the request as failed and leaves the overview empty", async () => {
      const { getTokenOverview, tokenOverview, isRequestFailed } = useTokenOverview();
      await getTokenOverview(tokenAddress);

      expect(tokenOverview.value).toBeNull();
      expect(isRequestFailed.value).toBe(true);
    });
  });
});
