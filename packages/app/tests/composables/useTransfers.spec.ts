import { computed, type ComputedRef } from "vue";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { useContextMock } from "./../mocks";

import useTransfers from "@/composables/useTransfers";

const baseTransferPayload = {
  from: "from",
  to: "to",
  blockNumber: 123,
  transactionHash: "transactionHash",
  amount: "100",
  token: {
    l1Address: "l1Address",
    l2Address: "l2Address",
    name: "token name",
    symbol: "token symbol",
    decimals: 18,
    iconURL: null,
    usdPrice: null,
    liquidity: null,
  },
  tokenAddress: "tokenAddress",
};

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() =>
      Promise.resolve({
        items: [
          { ...baseTransferPayload, type: "transfer" },
          { ...baseTransferPayload, token: null, type: "transfer" },
          { ...baseTransferPayload, type: "deposit" },
          { ...baseTransferPayload, type: "withdrawal" },
        ],
        meta: {
          totalItems: 4,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          itemCount: 1,
        },
      })
    ),
  };
});

//

describe("useTransfers:", () => {
  let mockContext: SpyInstance;
  let address: ComputedRef<string>;

  beforeEach(() => {
    mockContext = useContextMock();
    address = computed(() => "address");
  });

  afterEach(() => {
    mockContext?.mockRestore();
  });
  /* eslint-disable  @typescript-eslint/no-explicit-any */

  it("creates useTransfers composable", () => {
    const composable = useTransfers(address);
    expect(composable.pending).toBeDefined();
    expect(composable.failed).toBeDefined();
    expect(composable.load).toBeDefined();
    expect(composable.data).toBeDefined();
  });

  it("gets transfers from API and returns mapped results", async () => {
    const composable = useTransfers(address);
    await composable.load(1);
    const transfers = composable.data.value;
    expect(composable.data.value?.length).toBe(4);
    expect(transfers).toEqual([
      {
        ...baseTransferPayload,
        type: "transfer",
        fromNetwork: "L2",
        toNetwork: "L2",
      },
      {
        ...baseTransferPayload,
        token: {
          decimals: 0,
          l1Address: null,
          l2Address: "tokenAddress",
          name: null,
          symbol: null,
          iconURL: null,
          usdPrice: null,
          liquidity: null,
        },
        type: "transfer",
        fromNetwork: "L2",
        toNetwork: "L2",
      },
      {
        ...baseTransferPayload,
        type: "deposit",
        fromNetwork: "L1",
        toNetwork: "L2",
      },
      {
        ...baseTransferPayload,
        type: "withdrawal",
        fromNetwork: "L2",
        toNetwork: "L1",
      },
    ]);
  });

  it("sets pending to true when request pending", async () => {
    const composable = useTransfers(address);
    const promise = composable.load(1);

    expect(composable.pending.value).toEqual(true);
    await promise;
  });

  it("sets pending to false when request completed", async () => {
    const composable = useTransfers(address);
    await composable.load(1);

    expect(composable.pending.value).toEqual(false);
  });

  it("sets failed to false when request completed", async () => {
    const composable = useTransfers(address);
    await composable.load(1);

    expect(composable.failed.value).toEqual(false);
  });

  it("sets failed to true when request failed", async () => {
    const composable = useTransfers(address);
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.failed.value).toEqual(true);
    mock.mockRestore();
  });

  it("sets transfers to null when request failed", async () => {
    const composable = useTransfers(address);
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.data.value).toEqual(null);
    mock.mockRestore();
  });
});
