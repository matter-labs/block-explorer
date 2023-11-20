import { ref } from "vue";

import { useMemoize } from "@vueuse/core";
import { $fetch } from "ohmyfetch";

import useContext, { type Context } from "@/composables/useContext";
import useTokenLibrary from "@/composables/useTokenLibrary";

import type { Hash } from "@/types";

export type Token = Api.Response.Token;

export const retrieveToken = useMemoize(
  (tokenAddress: Hash, context: Context = useContext()): Promise<Api.Response.Token> => {
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
      tokenInfo.value = token;
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
