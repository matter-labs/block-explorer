import { computed, ref } from "vue";

import { $fetch } from "ohmyfetch";

import useContext from "@/composables/useContext";

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

    const response = await $fetch<{ ok: true; token: string }>(`${context.currentNetwork.value.apiUrl}/auth/token`, {
      credentials: "include",
      method: "POST",
    });
    rpcToken.value = response.token;
  };

  return {
    updatePrividiumRpcUrl,
    prividiumRpcUrl: rpcUrl,
  };
};
