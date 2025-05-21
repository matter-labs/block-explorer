import { computed, ref } from "vue";

import useContext from "@/composables/useContext";
import useFetch from "@/composables/useFetch";

export default (context = useContext()) => {
  const rpcToken = ref<string | null>(null);

  const rpcUrl = computed(() => {
    const network = context.currentNetwork.value;
    const token = rpcToken.value;
    return token ? `${network.rpcUrl}/${token}` : null;
  });

  const updatePrividiumRpcUrl = async () => {
    if (rpcToken.value !== null) {
      return;
    }

    const response = await useFetch()<{ ok: true; token: string }>(
      `${context.currentNetwork.value.apiUrl}/auth/token`,
      {
        method: "POST",
      }
    );
    rpcToken.value = response.token;
  };

  return {
    updatePrividiumRpcUrl,
    prividiumRpcUrl: rpcUrl,
  };
};
