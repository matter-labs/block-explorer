import { ref } from "vue";
import { useRouter } from "vue-router";

import { $fetch, FetchError } from "ohmyfetch";

import useContext from "./useContext";

import { isAddress, isBlockNumber, isTransactionHash } from "@/utils/validators";

export default (context = useContext()) => {
  const router = useRouter();
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);

  const search = async (param: string) => {
    const endpoints = [
      {
        routeParam: { address: param },
        apiRoute: "address",
        isValid: isAddress(param),
        routeName: "address",
      },
      {
        routeParam: { id: param },
        apiRoute: "batches",
        isValid: isBlockNumber(param),
        routeName: "batch",
      },
      {
        routeParam: { hash: param },
        apiRoute: "transactions",
        isValid: isTransactionHash(param),
        routeName: "transaction",
      },
    ];
    isRequestPending.value = true;
    try {
      for (const item of endpoints) {
        try {
          if (!item.isValid) {
            continue;
          }
          await $fetch(`${context.currentNetwork.value.apiURLv2}/${item.apiRoute}/${param}`);

          await router.push({ name: item.routeName, params: item.routeParam });
          return;
        } catch (error) {
          if (!(error instanceof FetchError) || (error instanceof FetchError && error.response?.status !== 404)) {
            throw error;
          }
        }
      }
      await router.push({ name: "not-found" });
    } catch (error) {
      isRequestFailed.value = true;
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    search,
    isRequestPending,
    isRequestFailed,
  };
};
