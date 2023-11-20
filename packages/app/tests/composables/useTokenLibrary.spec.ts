import { computed } from "vue";

import { describe, expect, it, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import { GOERLI_BETA_NETWORK } from "../mocks";

import useTokenLibrary from "@/composables/useTokenLibrary";

vi.mock("ohmyfetch", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const mod = await vi.importActual<typeof import("ohmyfetch")>("ohmyfetch");
  return {
    ...mod,
    $fetch: vi.fn().mockResolvedValue([
      {
        decimals: 18,
        iconURL: "https://icon.url",
        l1Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        name: "Ether",
        symbol: "ETH",
      } as Api.Response.Token,
    ]),
  };
});

describe("useTokenLibrary:", () => {
  it("caches the results", async () => {
    const { getTokens } = useTokenLibrary();
    await getTokens();
    await getTokens();
    expect($fetch).toHaveBeenCalledTimes(1);
  });
  it("sets isRequestPending to true when request is pending", async () => {
    const { isRequestPending, getTokens } = useTokenLibrary();

    const promise = getTokens();

    expect(isRequestPending.value).toEqual(true);
    await promise;
  });
  it("sets isRequestPending to false when request is completed", async () => {
    const { isRequestPending, getTokens } = useTokenLibrary();
    await getTokens();
    expect(isRequestPending.value).toEqual(false);
  });
  it("sets isRequestFailed to true when request failed", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ($fetch as any).mockRejectedValueOnce(new FetchError("An error occurred"));
    const { isRequestFailed, getTokens } = useTokenLibrary({
      currentNetwork: computed(() => GOERLI_BETA_NETWORK),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    await getTokens();

    expect(isRequestFailed.value).toEqual(true);
  });
});
