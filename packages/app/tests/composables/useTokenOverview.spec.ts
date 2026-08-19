import { computed } from "vue";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { TESTNET_NETWORK, useContextMock } from "./../mocks";

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

vi.mock("ohmyfetch", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance: any = vi.fn();
  instance.create = () => instance;
  return { $fetch: instance };
});

const fetchMock = $fetch as unknown as SpyInstance;

describe("useTokenOverview:", () => {
  let mockContext: SpyInstance;

  afterEach(() => {
    mockContext?.mockRestore();
    fetchMock.mockReset();
    totalSupplyMock.mockClear();
  });

  describe("on a public network", () => {
    beforeEach(() => {
      mockContext = useContextMock();
    });

    it("reads the supply straight from the contract", async () => {
      const { getTokenOverview, tokenOverview } = useTokenOverview();
      await getTokenOverview(tokenAddress);

      expect(totalSupplyMock).toHaveBeenCalledOnce();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(tokenOverview.value).toEqual({ totalSupply: BigInt("500000000000000000") });
    });
  });

  describe("on a Prividium network", () => {
    beforeEach(() => {
      mockContext = useContextMock({
        currentNetwork: computed(() => ({ ...TESTNET_NETWORK, prividium: true })),
      });
    });

    it("reads the supply through the explorer API", async () => {
      fetchMock.mockResolvedValueOnce({ totalSupply: "500000000000000000" });

      const { getTokenOverview, tokenOverview } = useTokenOverview();
      await getTokenOverview(tokenAddress);

      expect(totalSupplyMock).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith(`/tokens/${tokenAddress}/total-supply`);
      expect(tokenOverview.value).toEqual({ totalSupply: "500000000000000000" });
    });

    it("leaves the overview empty when the supply is not readable", async () => {
      fetchMock.mockResolvedValueOnce({ totalSupply: null });

      const { getTokenOverview, tokenOverview, isRequestFailed } = useTokenOverview();
      await getTokenOverview(tokenAddress);

      expect(tokenOverview.value).toBeNull();
      expect(isRequestFailed.value).toBe(false);
    });

    it("marks the request as failed when the API errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("boom"));

      const { getTokenOverview, tokenOverview, isRequestFailed } = useTokenOverview();
      await getTokenOverview(tokenAddress);

      expect(tokenOverview.value).toBeNull();
      expect(isRequestFailed.value).toBe(true);
    });
  });
});
