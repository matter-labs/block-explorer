import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { useContextMock } from "./../mocks";

import useBatches from "@/composables/useBatches";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() =>
      Promise.resolve({
        items: [
          {
            number: 2,
            timestamp: "2023-02-07T12:24:08.000Z",
            l1TxCount: 1,
            l2TxCount: 107,
            rootHash: "0x0bcd1b80525cd54303a1596b8241e4f6d8f3acb1c074e3537e6889d9ff10b7cb",
            status: "verified",
          },
        ],
        meta: {
          totalItems: 1,
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

describe("useBatches:", () => {
  let mockContext: SpyInstance;

  beforeEach(() => {
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
  });
  /* eslint-disable  @typescript-eslint/no-explicit-any */

  it("creates useBatches composable", () => {
    const composable = useBatches();
    expect(composable.pending).toBeDefined();
    expect(composable.failed).toBeDefined();
    expect(composable.load).toBeDefined();
    expect(composable.data).toBeDefined();
  });

  it("gets batches from API", async () => {
    const composable = useBatches();
    await composable.load(1);
    const batch = (composable.data.value || [])[0];

    expect(composable.data.value?.length).toBe(1);
    expect(batch).toEqual({
      number: 2,
      timestamp: "2023-02-07T12:24:08.000Z",
      l1TxCount: 1,
      l2TxCount: 107,
      rootHash: "0x0bcd1b80525cd54303a1596b8241e4f6d8f3acb1c074e3537e6889d9ff10b7cb",
      status: "verified",
    });
  });

  it("sets pending to true when request pending", async () => {
    const composable = useBatches();
    const promise = composable.load(1);

    expect(composable.pending.value).toEqual(true);
    await promise;
  });

  it("sets pending to false when request completed", async () => {
    const composable = useBatches();
    await composable.load(1);

    expect(composable.pending.value).toEqual(false);
  });

  it("sets failed to false when request completed", async () => {
    const composable = useBatches();
    await composable.load(1);

    expect(composable.failed.value).toEqual(false);
  });

  it("sets failed to true when request failed", async () => {
    const composable = useBatches();
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.failed.value).toEqual(true);
    mock.mockRestore();
  });

  it("sets batches to null when request failed", async () => {
    const composable = useBatches();
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.data.value).toEqual(null);
    mock.mockRestore();
  });
});
