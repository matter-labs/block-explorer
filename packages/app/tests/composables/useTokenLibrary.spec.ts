import { computed } from "vue";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch, FetchError } from "ohmyfetch";

import { GOERLI_BETA_NETWORK } from "../mocks";

import useTokenLibrary from "@/composables/useTokenLibrary";

vi.mock("ohmyfetch", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const mod = await vi.importActual<typeof import("ohmyfetch")>("ohmyfetch");
  return {
    ...mod,
    $fetch: vi.fn(),
  };
});

describe("useTokenLibrary:", () => {
  const fetchSpy = $fetch as unknown as SpyInstance;
  beforeEach(() => {
    fetchSpy
      .mockResolvedValueOnce({
        items: [
          {
            decimals: 18,
            iconURL: "https://icon.url",
            l1Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            name: "Ether",
            symbol: "ETH",
            liquidity: 0,
          } as Api.Response.Token,
        ],
        meta: {
          totalPages: 2,
          currentPage: 1,
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            decimals: 18,
            iconURL: "https://icon2.url",
            l1Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeef",
            l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeef",
            name: "Ether2",
            symbol: "ETH2",
            liquidity: 0,
          } as Api.Response.Token,
        ],
        meta: {
          totalPages: 2,
          currentPage: 2,
        },
      });
  });

  afterEach(() => {
    fetchSpy.mockReset();
  });

  it("caches the results", async () => {
    const { getTokens, tokens } = useTokenLibrary();
    await getTokens();
    await getTokens();
    await getTokens();
    await getTokens();
    expect($fetch).toHaveBeenCalledTimes(1);
    expect(tokens.value.length).toBe(1);
  });
  it("requests all tokens from using if min liquidity is defined", async () => {
    const { getTokens, tokens } = useTokenLibrary({
      currentNetwork: computed(() => ({
        ...GOERLI_BETA_NETWORK,
        tokensMinLiquidity: 0,
        name: "goerli_with_liquidity",
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    await getTokens();
    await getTokens();
    await getTokens();
    await getTokens();
    expect($fetch).toHaveBeenCalledTimes(2);
    expect(tokens.value.length).toBe(2);
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
    fetchSpy.mockReset();
    fetchSpy.mockRejectedValue(new FetchError("An error occurred"));
    const { isRequestFailed, getTokens } = useTokenLibrary({
      currentNetwork: computed(() => GOERLI_BETA_NETWORK),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    await getTokens();

    expect(isRequestFailed.value).toEqual(true);
  });
});
