import { ref } from "vue";

import { useMemoize } from "@vueuse/core";

import useContext, { type Context } from "@/composables/useContext";
import useTokenLibrary from "@/composables/useTokenLibrary";

import type { Hash } from "@/types";

import { ETH_TOKEN } from "@/utils/constants";

export const retrieveTokenPrice = useMemoize(
  async (tokenAddress: Hash, context: Context = useContext()): Promise<string | null> => {
    const provider = context.getL2Provider();
    const price = await provider.getTokenPrice(
      tokenAddress === ETH_TOKEN.l2Address ? ETH_TOKEN.l1Address : tokenAddress
    );
    if (price === "0") return null;
    return price;
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
  const tokenPrice = ref<string | null>(null);

  const getTokenPrice = async (address?: Hash) => {
    tokenPrice.value = null;
    isRequestFailed.value = false;
    if (!address) return;

    isRequestPending.value = true;
    try {
      await getTokens();
      const tokenFromLibrary = getToken(address);
      tokenPrice.value = tokenFromLibrary ? await retrieveTokenPrice(address) : null;
    } catch {
      isRequestFailed.value = true;
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    isRequestPending,
    isRequestFailed,
    tokenPrice,
    getTokenPrice,
  };
};
