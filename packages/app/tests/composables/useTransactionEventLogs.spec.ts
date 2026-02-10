import { describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import useTransactionEventLogs from "@/composables/useTransactionEventLogs";

import ERC20VerificationInfo from "@/../mock/contracts/ERC20VerificationInfo.json";

vi.mock("ohmyfetch", () => {
  const fetchSpy = vi.fn(() =>
    Promise.resolve({
      items: [],
      meta: { totalItems: 0, currentPage: 1, itemCount: 0, itemsPerPage: 10, totalPages: 0 },
      links: { first: "", last: "", next: "", previous: "" },
    })
  );
  (fetchSpy as unknown as { create: SpyInstance }).create = vi.fn(() => fetchSpy);
  return {
    $fetch: fetchSpy,
    FetchError: function error() {
      return;
    },
  };
});

const logItem = {
  address: "0x4732c03b2cf6ede46500e799de79a15df44929eb",
  data: "0x000000000000000000000000000000000000000000000000000002279f530c00",
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x000000000000000000000000cfa3dd0cba60484d1c8d0cdd22c5432013368875",
    "0x000000000000000000000000de03a0b5963f75f1c8485b355ff6d30f3093bde7",
  ],
  blockNumber: 100,
  transactionHash: "0xabc123",
  transactionIndex: 0,
  logIndex: 1,
};

describe("useTransactionEventLogs:", () => {
  it("creates composable with correct initial values", () => {
    const result = useTransactionEventLogs();
    expect(result.collection.value).toEqual([]);
    expect(result.total.value).toBe(0);
    expect(result.isRequestPending.value).toBe(false);
    expect(result.isRequestFailed.value).toBe(false);
    expect(result.isDecodePending.value).toBe(false);
    expect(result.getCollection).toBeDefined();
  });

  it("fetches logs and sets total from API response", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockResolvedValueOnce({
      items: [logItem],
      meta: { totalItems: 42, currentPage: 1, itemCount: 1, itemsPerPage: 10, totalPages: 5 },
      links: { first: "", last: "", next: "", previous: "" },
    });
    // Mock the verification API call for ABI fetch
    mock.mockResolvedValueOnce({ status: "0", result: "[]" });

    const { collection, total, isRequestPending, getCollection } = useTransactionEventLogs();

    const promise = getCollection("0xhash123", 1, 10);
    expect(isRequestPending.value).toBe(true);

    await promise;
    expect(isRequestPending.value).toBe(false);
    expect(total.value).toBe(42);
    expect(collection.value.length).toBe(1);
    expect(collection.value[0].address).toBeDefined();
    mock.mockRestore();
  });

  it("sets isRequestFailed on error", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockRejectedValueOnce(new Error("Network error"));

    const { isRequestFailed, getCollection } = useTransactionEventLogs();
    await getCollection("0xhash123", 1, 10);

    expect(isRequestFailed.value).toBe(true);
    mock.mockRestore();
  });

  it("resets collection on error", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockRejectedValueOnce(new Error("Network error"));

    const { collection, total, getCollection } = useTransactionEventLogs();
    await getCollection("0xhash123", 1, 10);

    expect(collection.value).toEqual([]);
    expect(total.value).toBe(0);
    mock.mockRestore();
  });

  it("passes page and limit as search params", async () => {
    const mock = ($fetch as unknown as SpyInstance).mockResolvedValueOnce({
      items: [],
      meta: { totalItems: 0, currentPage: 2, itemCount: 0, itemsPerPage: 50, totalPages: 0 },
      links: { first: "", last: "", next: "", previous: "" },
    });

    const { getCollection } = useTransactionEventLogs();
    await getCollection("0xhash123", 2, 50);

    expect(mock).toHaveBeenCalledWith(expect.stringContaining("/transactions/0xhash123/logs?page=2&limit=50"));
    mock.mockRestore();
  });
});
