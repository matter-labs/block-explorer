import { ref } from "vue";

import { useMemoize } from "@vueuse/core";
import { $fetch } from "ohmyfetch";

import { retrieveTokenPrice } from "./useTokenPrice";

import useContext, { type Context } from "@/composables/useContext";
import useTokenLibrary from "@/composables/useTokenLibrary";

import type { Address, Hash } from "@/types";

import { ETH_TOKEN } from "@/utils/constants";

export type ApiToken = Api.Response.Token;

export type Token = {
  address: Address;
  name: string | null;
  symbol: string | null;
  decimals: number;
  usdPrice: string | null;
};

export const retrieveToken = useMemoize(
  (tokenAddress: Hash, context: Context = useContext()): Promise<Api.Response.Token> => {
    if (tokenAddress === ETH_TOKEN.l2Address) {
      return Promise.resolve(ETH_TOKEN);
    }
    return $fetch(`${context.currentNetwork.value.apiUrl}/tokens/${tokenAddress}`);
  },
  {
    getKey(tokenAddress: Hash, context: Context = useContext()) {
      return tokenAddress + context.currentNetwork.value.name;
    },
  }
);

export default () => {
  const { getToken, getTokens } = useTokenLibrary();

  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const tokenInfo = ref(null as Token | null);

  const getTokenInfo = async (address?: Hash) => {
    tokenInfo.value = null;
    isRequestFailed.value = false;
    if (!address) return;

    isRequestPending.value = true;
    try {
      await getTokens();
      const tokenFromLibrary = getToken(address);
      const token = tokenFromLibrary || (await retrieveToken(address));
      const tokenPrice = tokenFromLibrary ? await retrieveTokenPrice(address) : null;
      tokenInfo.value = {
        address: token.l2Address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        usdPrice: tokenPrice,
      };
    } catch {
      isRequestFailed.value = true;
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    isRequestPending,
    isRequestFailed,
    tokenInfo,
    getTokenInfo,
  };
};
