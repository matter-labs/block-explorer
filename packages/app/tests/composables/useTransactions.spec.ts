import { computed, type ComputedRef } from "vue";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { useContextMock } from "./../mocks";

import useTransactions, { type TransactionListItem, type TransactionSearchParams } from "@/composables/useTransactions";

const transaction: TransactionListItem = {
  hash: "0x20e564c3178e1f059c8ac391f35dd73c20ac4a4731b23fa7e436b3d221676ff6",
  to: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
  from: "0xb942802a389d23fCc0a807d4aa85e956dcF20f5B",
  data: "0x095ea7b30000000000000000000000002da10a1e27bf85cedd8ffb1abbe97e53391c02950000000000000000000000000000000000000000000000000000000000a7d8c0",
  value: "0",
  isL1Originated: false,
  fee: "0x3b9329f2a880",
  nonce: 69,
  blockNumber: 6539779,
  l1BatchNumber: 74373,
  blockHash: "0x5ad6b0475a6bdff6007e62adec0ceed0796fb427fe8f4de310432a52e118800b",
  transactionIndex: 5,
  receivedAt: "2023-06-20T12:10:44.187Z",
  status: "included",
  commitTxHash: null,
  executeTxHash: null,
  proveTxHash: null,
  isL1BatchSealed: false,
  gasPrice: "4000",
  gasLimit: "5000",
  gasUsed: "3000",
  gasPerPubdata: "800",
  maxFeePerGas: "7000",
  maxPriorityFeePerGas: "8000",
  error: null,
  revertReason: null,
};

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() =>
      Promise.resolve({
        items: new Array(3).fill(transaction),
        meta: {
          totalItems: 3,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          itemCount: 1,
        },
      })
    ),
  };
});

describe("useTransactions:", () => {
  let mockContext: SpyInstance;
  let searchParams: ComputedRef<TransactionSearchParams>;
  let fetchMock: SpyInstance;

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  beforeEach(() => {
    mockContext = useContextMock();
    searchParams = computed(() => ({}));
    fetchMock = $fetch as any as SpyInstance;
  });

  afterEach(() => {
    mockContext?.mockRestore();
    fetchMock.mockRestore();
  });

  it("creates useTransactions composable", () => {
    const composable = useTransactions(searchParams);
    expect(composable.pending).toBeDefined();
    expect(composable.failed).toBeDefined();
    expect(composable.load).toBeDefined();
    expect(composable.data).toBeDefined();
  });

  it("skips falsy query params except zero numbers", async () => {
    searchParams = computed(() => ({
      address: "",
      fromDate: undefined,
      toDate: undefined,
      blockNumber: 0,
      l1BatchNumber: 0,
    }));
    const composable = useTransactions(searchParams);
    await composable.load(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://block-explorer-api.testnets.zksync.dev/transactions?blockNumber=0&l1BatchNumber=0&pageSize=10&page=1"
    );
  });

  it("gets transactions from API and returns mapped results", async () => {
    const composable = useTransactions(searchParams);
    await composable.load(1);
    const transactions = composable.data.value;
    expect(transactions?.length).toBe(3);
    expect(transactions).toEqual(new Array(3).fill(transaction));
  });

  it("sets pending to true when request pending", async () => {
    const composable = useTransactions(searchParams);
    const promise = composable.load(1);

    expect(composable.pending.value).toEqual(true);
    await promise;
  });

  it("sets pending to false when request completed", async () => {
    const composable = useTransactions(searchParams);
    await composable.load(1);

    expect(composable.pending.value).toEqual(false);
  });

  it("sets failed to false when request completed", async () => {
    const composable = useTransactions(searchParams);
    await composable.load(1);

    expect(composable.failed.value).toEqual(false);
  });

  it("sets failed to true when request failed", async () => {
    const composable = useTransactions(searchParams);
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.failed.value).toEqual(true);
    mock.mockRestore();
  });

  it("sets transactions to null when request failed", async () => {
    const composable = useTransactions(searchParams);
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.data.value).toEqual(null);
    mock.mockRestore();
  });
});
