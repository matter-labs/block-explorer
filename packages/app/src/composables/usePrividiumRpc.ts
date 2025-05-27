import { ref } from "vue";

import useContext from "@/composables/useContext";
import useFetch from "@/composables/useFetch";

const rpcToken = ref<string | null>(null);
const rpcUrl = ref<string | null>(null);

export default (context = useContext()) => {
  const initializePrividiumRpcUrl = async () => {
    if (!context.user.value.loggedIn) {
      return;
    }
    await updatePrividiumRpcUrl();
  };

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
    rpcUrl.value = `${context.currentNetwork.value.rpcUrl}/${response.token}`;
  };

  return {
    initializePrividiumRpcUrl,
    updatePrividiumRpcUrl,
    prividiumRpcUrl: rpcUrl,
  };
};
