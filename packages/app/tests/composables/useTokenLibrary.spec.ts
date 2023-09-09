import { describe, expect, it, vi } from "vitest";

import { computed } from "vue";

import * as tokenLibrary from "@matterlabs/token-library";

import { GOERLI_BETA_NETWORK } from "../mocks";

import useTokenLibrary from "@/composables/useTokenLibrary";

const tokensCollection: tokenLibrary.Token[] = [
  {
    decimals: 18,
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/token-library.appspot.com/o/eth.svg?alt=media&token=1985e3d8-3aa7-4d04-8839-565d4c341615",
    l1Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    name: "Ether",
    symbol: "ETH",
  },
];

describe("useTokenLibrary:", () => {
  it("caches the results", async () => {
    const collectionMock = vi.spyOn(tokenLibrary, "getTokenCollection").mockResolvedValue(tokensCollection);
    const { getTokens } = useTokenLibrary();
    await getTokens();
    await getTokens();
    expect(collectionMock).toHaveBeenCalledTimes(1);
    collectionMock.mockRestore();
  });
  it("sets isRequestPending to true when request is pending", async () => {
    const collectionMock = vi.spyOn(tokenLibrary, "getTokenCollection").mockResolvedValue(tokensCollection);
    const { isRequestPending, getTokens } = useTokenLibrary();

    const promise = getTokens();

    expect(isRequestPending.value).toEqual(true);
    await promise;
    collectionMock.mockRestore();
  });
  it("sets isRequestPending to false when request is completed", async () => {
    const collectionMock = vi.spyOn(tokenLibrary, "getTokenCollection").mockResolvedValue(tokensCollection);
    const { isRequestPending, getTokens } = useTokenLibrary();
    await getTokens();
    expect(isRequestPending.value).toEqual(false);
    collectionMock.mockRestore();
  });
  it("sets isRequestFailed to true when request failed", async () => {
    const collectionMock = vi
      .spyOn(tokenLibrary, "getTokenCollection")
      .mockRejectedValue(new Error("An error occurred"));
    const { isRequestFailed, getTokens } = useTokenLibrary({
      currentNetwork: computed(() => GOERLI_BETA_NETWORK),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    await getTokens();

    expect(isRequestFailed.value).toEqual(true);
    collectionMock.mockRestore();
  });
});
