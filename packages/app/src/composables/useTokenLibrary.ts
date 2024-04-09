import { ref } from "vue";

import { useMemoize } from "@vueuse/core";
import { $fetch } from "ohmyfetch";

import useContext, { type Context } from "@/composables/useContext";

const retrieveTokens = useMemoize(
  async (context: Context): Promise<Api.Response.Token[]> => {
    const tokens = [];
    const tokensParams = {
      ...(context.currentNetwork.value.tokensMinLiquidity != null && {
        minLiquidity: context.currentNetwork.value.tokensMinLiquidity.toString(),
      }),
      limit: "100",
    };
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const tokensResponse = await $fetch<Api.Response.Collection<Api.Response.Token>>(
        `${context.currentNetwork.value.apiUrl}/tokens?${new URLSearchParams(tokensParams).toString()}&page=${page}`
      );
      tokens.push(...tokensResponse.items);
      page++;
      hasMore = !!tokensParams.minLiquidity && tokensResponse.meta.totalPages > tokensResponse.meta.currentPage;
    }

    return tokens;
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
  const tokens = ref<Api.Response.Token[]>([]);

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
