import { ref } from "vue";
import { useRouter } from "vue-router";

import { $fetch, FetchError } from "ohmyfetch";

import useContext from "./useContext";

import { isAddress, isBlockNumber, isTransactionHash } from "@/utils/validators";

export default (context = useContext()) => {
  const router = useRouter();
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);

  const getSearchRoute = (param: string) => {
    try {
      const searchRoutes = [
        {
          routeParam: { address: param },
          apiRoute: "address",
          isValid: () => isAddress(param),
          routeName: "address",
          prefetch: true,
        },
        {
          routeParam: { id: param },
          apiRoute: "batches",
          isValid: () => isBlockNumber(param),
          routeName: "batch",
          prefetch: true,
        },
        {
          routeParam: { hash: param },
          apiRoute: "transactions",
          isValid: () => isTransactionHash(param),
          routeName: "transaction",
          prefetch: false,
        },
      ];

      return searchRoutes.find((searchRoute) => searchRoute.isValid());
    } catch {
      return null;
    }
  };

  const search = async (param: string) => {
    isRequestPending.value = true;
    const searchRoute = getSearchRoute(param);
    if (searchRoute) {
      try {
        if (searchRoute.prefetch) {
          await $fetch(`${context.currentNetwork.value.apiUrl}/${searchRoute.apiRoute}/${param}`);
        }
        await router.push({ name: searchRoute.routeName, params: searchRoute.routeParam });
        return;
      } catch (error) {
        if (!(error instanceof FetchError) || (error instanceof FetchError && error.response?.status !== 404)) {
          isRequestFailed.value = true;
        }
      } finally {
        isRequestPending.value = false;
      }
    }
    await router.push({ name: "not-found" });
  };

  return {
    search,
    getSearchRoute,
    isRequestPending,
    isRequestFailed,
  };
};
