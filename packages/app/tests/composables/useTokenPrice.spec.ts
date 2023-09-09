/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed } from "vue";

import { afterEach, beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { GOERLI_NETWORK, useContextMock } from "../mocks";

import * as useContext from "@/composables/useContext";
import useTokenPrice from "@/composables/useTokenPrice";

const token: Api.Response.Token = {
  l1Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  l2Address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeb",
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
};

vi.mock("@/composables/useTokenLibrary", () => {
  return {
    default: () => ({
      getTokens: () => undefined,
      getToken: () => token,
    }),
  };
});
vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => Promise.resolve(token)),
  };
});

describe("useTokenPrice:", () => {
  let mockContext: SpyInstance;
  beforeEach(() => {
    mockContext = useContextMock();
  });
  afterEach(() => {
    mockContext?.mockRestore();
  });

  it("requests token info", async () => {
    const mockContextConfig = vi.spyOn(useContext, "default").mockReturnValue({
      currentNetwork: computed(() => GOERLI_NETWORK),
      getL2Provider: () => ({
        getTokenPrice: vi.fn(() => Promise.resolve("3500")),
      }),
    } as any);
    const { getTokenPrice, tokenPrice } = useTokenPrice();
    await getTokenPrice(token.l2Address);
    expect(tokenPrice.value).toEqual("3500");
    mockContextConfig.mockRestore();
  });
});
