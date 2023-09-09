import { describe, expect, it, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import useBatch, { type BatchDetails } from "@/composables/useBatch";

const batchItem: BatchDetails = {
  number: "42",
  size: 1,
  timestamp: "2023-02-08T16:08:16.000Z",
  l1TxCount: 9,
  l2TxCount: 0,
  rootHash: "0x8983f748ff6c2f9038904d65dc63a344db33c29d97f1741a931e90689f86b2be",
  status: "verified",
  commitTxHash: "0x0ab34d8523b67f80783305760a2989ffe6ab205621813db5420a3012845f5ac7",
  committedAt: "2023-02-08T16:16:18.247570Z",
  proveTxHash: "0x87c5c5bf78100d88766101f13ec78d3b3356929556ee971cfacb6fe2a53b210a",
  provenAt: "2023-02-08T16:16:38.475210Z",
  executeTxHash: "0x57c44d7c183633f81bfa155bd30e68a94e3ff12c1e6265a4b5e06b6d4a7a1fa8",
  executedAt: "2023-02-08T16:17:00.484429Z",
  l1GasPrice: "39190145992",
  l2FairGasPrice: "500000000",
};

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => Promise.resolve(batchItem)),
    FetchError: function error() {
      return;
    },
  };
});

describe("useBatch:", () => {
  it("creates useBatch composable", () => {
    const result = useBatch();
    expect(result.isRequestPending).toBeDefined();
    expect(result.isRequestFailed).toBeDefined();
    expect(result.getById).toBeDefined();
    expect(result.batchItem).toBeDefined();
  });
  it("sets value from request to batchItem", async () => {
    const result = useBatch();
    await result.getById("42");
    expect(result.batchItem.value).toEqual(batchItem);
  });
  it("sets isRequestPending to true when request is pending", async () => {
    const { isRequestPending, getById } = useBatch();
    const promise = getById("42");
    expect(isRequestPending.value).toEqual(true);
    await promise;
  });
  it("sets isRequestPending to false when request is finished", async () => {
    const { isRequestPending, getById } = useBatch();
    const promise = getById("42");
    expect(isRequestPending.value).toEqual(true);
    await promise;
    expect(isRequestPending.value).toEqual(false);
  });
  it("sets isRequestFailed to true when request failed", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mock = ($fetch as any).mockRejectedValue(new Error("An error occurred"));
    const { isRequestFailed, getById } = useBatch();
    await getById("42");

    expect(isRequestFailed.value).toEqual(true);
    mock.mockRestore();
  });
  it("sets batchItem to null and failed to false when request fails with status code 404", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error: any = new FetchError("404");
    error.response = {
      status: 404,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mock = ($fetch as any).mockRejectedValue(error);
    const { isRequestFailed, batchItem, getById } = useBatch();
    await getById("42");

    expect(batchItem.value).toEqual(null);
    expect(isRequestFailed.value).toEqual(false);
    mock.mockRestore();
  });
});
