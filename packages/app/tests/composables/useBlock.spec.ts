import { describe, expect, it, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import useBlock from "@/composables/useBlock";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() =>
      Promise.resolve({ transactionHash: "0xc3867cd967e3a577e02e0c9afa6a4845a252e276b94a2244d57123a6e509829e" })
    ),
    FetchError: function error() {
      return;
    },
  };
});

describe("useBlock:", () => {
  it("creates useBlock composable", () => {
    const result = useBlock();
    expect(result.isRequestPending).toBeDefined();
    expect(result.isRequestFailed).toBeDefined();
    expect(result.getById).toBeDefined();
    expect(result.blockItem).toBeDefined();
  });
  it("sets value from request to blockItem", async () => {
    const result = useBlock();
    await result.getById("4314");
    expect(result.blockItem.value).toEqual({
      transactionHash: "0xc3867cd967e3a577e02e0c9afa6a4845a252e276b94a2244d57123a6e509829e",
    });
  });
  it("sets isRequestPending to true when request is pending", async () => {
    const { isRequestPending, getById } = useBlock();
    const promise = getById("1234");
    expect(isRequestPending.value).toEqual(true);
    await promise;
  });
  it("sets isRequestPending to false when request is finished", async () => {
    const { isRequestPending, getById } = useBlock();
    const promise = getById("1234");
    expect(isRequestPending.value).toEqual(true);
    await promise;
    expect(isRequestPending.value).toEqual(false);
  });
  it("sets isRequestFailed to true when request failed", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mock = ($fetch as any).mockRejectedValue(new Error("An error occurred"));
    const { isRequestFailed, getById } = useBlock();
    await getById("1234");

    expect(isRequestFailed.value).toEqual(true);
    mock.mockRestore();
  });
  it("sets blockItem to null and failed to false when request fails with status code 404", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error: any = new FetchError("404");
    error.response = {
      status: 404,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mock = ($fetch as any).mockRejectedValue(error);
    const { isRequestFailed, blockItem, getById } = useBlock();
    await getById("1234");

    expect(blockItem.value).toEqual(null);
    expect(isRequestFailed.value).toEqual(false);
    mock.mockRestore();
  });
});
