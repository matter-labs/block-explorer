import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { useContextMock } from "./../mocks";

import useBlocks from "@/composables/useBlocks";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() =>
      Promise.resolve({
        items: [
          {
            hash: "0x5a606c1c09d5be2f73c413f27758459a959a642fd3dca2af05d153aac29e229b",
            l1TxCount: 0,
            l2TxCount: 1,
            number: 105205,
            status: "sealed",
            timestamp: "2022-04-13T13:09:31.000Z",
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

describe("UseBlocks:", () => {
  let mockContext: SpyInstance;

  beforeEach(() => {
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
  });
  /* eslint-disable  @typescript-eslint/no-explicit-any */

  it("creates useBlocks composable", () => {
    const composable = useBlocks();
    expect(composable.pending).toBeDefined();
    expect(composable.failed).toBeDefined();
    expect(composable.load).toBeDefined();
    expect(composable.data).toBeDefined();
  });

  it("gets blocks from API", async () => {
    const composable = useBlocks();
    await composable.load(1);
    const block = (composable.data.value || [])[0];

    expect(composable.data.value?.length).toBe(1);
    expect(block.hash).toBe("0x5a606c1c09d5be2f73c413f27758459a959a642fd3dca2af05d153aac29e229b");
    expect(block.l1TxCount).toBe(0);
    expect(block.l2TxCount).toBe(1);
    expect(block.number).toBe(105205);
    expect(block.status).toBe("sealed");
    expect(block.timestamp).toBe("2022-04-13T13:09:31.000Z");
  });

  it("sets pending to true when request pending", async () => {
    const composable = useBlocks();
    const promise = composable.load(1);

    expect(composable.pending.value).toEqual(true);
    await promise;
  });

  it("sets pending to false when request completed", async () => {
    const composable = useBlocks();
    await composable.load(1);

    expect(composable.pending.value).toEqual(false);
  });

  it("sets failed to false when request completed", async () => {
    const composable = useBlocks();
    await composable.load(1);

    expect(composable.failed.value).toEqual(false);
  });

  it("sets failed to true when request failed", async () => {
    const composable = useBlocks();
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.failed.value).toEqual(true);
    mock.mockRestore();
  });

  it("sets blocks to null when request failed", async () => {
    const composable = useBlocks();
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.data.value).toEqual(null);
    mock.mockRestore();
  });
});
