import { ref } from "vue";
import { useRouter } from "vue-router";

import { FetchError } from "ohmyfetch";

import useContext from "./useContext";
import { FetchInstance } from "./useFetchInstance";

import { isAddress, isAddressEqual, isBlockNumber, isTransactionHash } from "@/utils/validators";

export default (context = useContext()) => {
  const router = useRouter();
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);

  const isPrividiumBaseTokenAddress = (address: string) =>
    !!context.currentNetwork.value.prividium && isAddressEqual(address, context.currentNetwork.value.baseTokenAddress);

  const getSearchRoute = (param: string) => {
    try {
      if (isAddress(param)) {
        const isBaseTokenAddress = isPrividiumBaseTokenAddress(param);
        const apiRoute = isBaseTokenAddress ? "tokens" : "address";
        return {
          routeParam: { address: param },
          apiRoute: apiRoute,
          isValid: () => true,
          routeName: apiRoute,
          prefetch: true,
        };
      }

      const searchRoutes = [
        {
          routeParam: { id: param },
          apiRoute: "blocks",
          isValid: () => isBlockNumber(param),
          routeName: "block",
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
          await FetchInstance.api(context)(`/${searchRoute.apiRoute}/${param}`);
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
