import { ref } from "vue";

import { getTokenCollection, type Token } from "@matterlabs/token-library";
import { useMemoize } from "@vueuse/core";

import useContext, { type Context } from "@/composables/useContext";
import useRuntimeConfig from "@/composables/useRuntimeConfig";

import { ETH_TOKEN } from "@/utils/constants";

const { appEnvironment } = useRuntimeConfig();

const retrieveTokens = useMemoize(
  async (context: Context): Promise<Token[]> => {
    return (
      await getTokenCollection(context.currentNetwork.value.l2ChainId, {
        staging: appEnvironment !== "production",
      })
    ).map((token) => ({
      ...token,
      l2Address: token.l2Address === ETH_TOKEN.l1Address ? ETH_TOKEN.l2Address : token.l2Address,
    }));
  },
  {
    getKey(context: Context) {
      return context.currentNetwork.value.name;
    },
  }
);

export default (context = useContext()) => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const tokens = ref<Token[]>([]);

  const getToken = (tokenAddress: string) => {
    return tokens.value.find((token) => token.l2Address === tokenAddress);
  };
  const getTokens = async () => {
    isRequestPending.value = true;
    isRequestFailed.value = false;
    try {
      tokens.value = await retrieveTokens(context);
    } catch {
      isRequestFailed.value = true;
    } finally {
      isRequestPending.value = false;
    }
    return false;
  };

  return {
    isRequestPending,
    isRequestFailed,
    tokens,
    getToken,
    getTokens,
  };
};
