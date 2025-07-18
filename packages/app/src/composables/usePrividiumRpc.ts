import { ref } from "vue";

import { FetchInstance } from "./useFetchInstance";

import useContext from "@/composables/useContext";

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

    const response = await FetchInstance.api(context)<{ ok: true; token: string }>("/auth/token", {
      method: "POST",
    });
    rpcToken.value = response.token;
    rpcUrl.value = `${context.currentNetwork.value.rpcUrl}/${response.token}`;
  };

  return {
    initializePrividiumRpcUrl,
    updatePrividiumRpcUrl,
    prividiumRpcUrl: rpcUrl,
  };
};
