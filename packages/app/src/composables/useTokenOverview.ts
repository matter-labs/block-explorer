import { ref } from "vue";

import useFetch from "./common/useFetch";
import useContext from "./useContext";

import type { Hash } from "@/types";

export type TokenOverview = Api.Response.TokenOverview;

export default () => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const tokenOverview = ref(null as TokenOverview | null);

  const getTokenOverview = async (address?: Hash, context = useContext()) => {
    tokenOverview.value = null;
    isRequestFailed.value = false;
    if (!address) {
      console.error("Token address is required");
      return;
    }

    const { failed, fetch, item, pending } = useFetch<TokenOverview>(
      () => new URL(`/tokens/${address}/overview`, context.currentNetwork.value.apiUrl)
    );
    await fetch();

    isRequestPending.value = pending.value;
    isRequestFailed.value = failed.value;
    tokenOverview.value = item.value;
  };

  return {
    isRequestPending,
    isRequestFailed,
    tokenOverview,
    getTokenOverview,
  };
};
