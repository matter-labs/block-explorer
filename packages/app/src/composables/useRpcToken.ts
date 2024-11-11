import { useStorage } from "@vueuse/core";
import { $fetch } from "ohmyfetch";
import { type Context } from "./useContext";
import { computed } from "vue";

const rpcBaseUrl = "https://sepolia.era.zksync.dev";

export const rpcToken = useStorage<string | null>("useRpcToken_rpcToken", null);

export const rpcUrl = computed(() => {
  if (rpcToken.value === null) {
    return null;
  }
  return `${rpcBaseUrl}/${rpcToken.value}`;
});

export default (context: Context) => {
  const getRpcToken = async () => {
    if (rpcToken.value !== null) {
      return { token: rpcToken.value, rpcUrl: `${rpcBaseUrl}/${rpcToken.value}` };
    }

    const response = await $fetch<{ ok: true; token: string }>(`${context.currentNetwork.value.apiUrl}/auth/token`, {
      credentials: "include",
    });
    rpcToken.value = response.token;
  };

  return {
    getRpcToken,
  };
};
