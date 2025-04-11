import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { useContextMock } from "../mocks";

import useTokenHolders from "@/composables/useTokenHolders";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() =>
      Promise.resolve({
        items: [
          {
            address: "0xe1134444211593Cfda9fc9eCc7B43208615556E2",
            balance: "5000000000000000000",
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
const tokenAddress = "0x0faF6df7054946141266420b43783387A78d82A9";

describe("useTokenHolders:", () => {
  let mockContext: SpyInstance;

  beforeEach(() => {
    mockContext = useContextMock();
  });

  afterEach(() => {
    mockContext?.mockRestore();
  });
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  it("creates useTokenHolders composable", () => {
    const composable = useTokenHolders(tokenAddress);
    expect(composable.pending).toBeDefined();
    expect(composable.failed).toBeDefined();
    expect(composable.load).toBeDefined();
    expect(composable.data).toBeDefined();
  });

  it("gets token holders from API", async () => {
    const composable = useTokenHolders(tokenAddress);
    await composable.load(1);
    const batch = (composable.data.value || [])[0];

    expect(composable.data.value?.length).toBe(1);
    expect(batch).toEqual({
      address: "0xe1134444211593Cfda9fc9eCc7B43208615556E2",
      balance: "5000000000000000000",
    });
  });

  it("sets pending to true when request pending", async () => {
    const composable = useTokenHolders(tokenAddress);
    const promise = composable.load(1);

    expect(composable.pending.value).toEqual(true);
    await promise;
  });

  it("sets pending to false when request completed", async () => {
    const composable = useTokenHolders(tokenAddress);
    await composable.load(1);

    expect(composable.pending.value).toEqual(false);
  });

  it("sets failed to false when request completed", async () => {
    const composable = useTokenHolders(tokenAddress);
    await composable.load(1);

    expect(composable.failed.value).toEqual(false);
  });

  it("sets failed to true when request failed", async () => {
    const composable = useTokenHolders(tokenAddress);
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.failed.value).toEqual(true);
    mock.mockRestore();
  });

  it("sets batches to null when request failed", async () => {
    const composable = useTokenHolders(tokenAddress);
    const mock = ($fetch as any).mockRejectedValue(new Error());

    await composable.load(1);

    expect(composable.data.value).toEqual(null);
    mock.mockRestore();
  });
});
