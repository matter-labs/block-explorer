import { ref } from "vue";

import { useMemoize } from "@vueuse/core";
import { FetchError } from "ohmyfetch";

import { FetchInstance } from "./useFetchInstance";

import useContext, { type Context } from "@/composables/useContext";

import type { AbiFragment } from "./useAddress";
import type { Address } from "@/types";

import { checksumAddress } from "@/utils/formatters";

const getABI = useMemoize(
  async (address: Address, context: Context = useContext()): Promise<AbiFragment[] | null> => {
    if (!context.currentNetwork.value.verificationApiUrl) {
      return null;
    }
    const { result, status } = await FetchInstance.verificationApi(context)(
      `?module=contract&action=getabi&address=${address}`
    );
    if (status === "0") {
      return null;
    }
    return JSON.parse(result);
  },
  {
    getKey(address: Address, context: Context = useContext()) {
      return address + context.currentNetwork.value.name;
    },
  }
);

export default (context = useContext()) => {
  const collection = ref<{ [contractAddress: string]: AbiFragment[] }>({});
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);

  const getCollection = async (addresses: Address[]) => {
    isRequestPending.value = true;
    isRequestFailed.value = false;
    const contractAbis = await Promise.all(
      addresses.map(async (address) => {
        try {
          const abi = await getABI(address, context);
          return {
            address,
            abi,
          };
        } catch (error) {
          if (!(error instanceof FetchError) || error.response?.status !== 404) {
            isRequestFailed.value = true;
          }
          return {
            address,
            abi: null,
          };
        }
      })
    );

    collection.value = contractAbis.reduce((acc: { [contractAddress: string]: AbiFragment[] }, val) => {
      if (val.abi) {
        acc[checksumAddress(val.address)] = val.abi;
      }
      return acc;
    }, {});
    isRequestPending.value = false;
  };

  return {
    collection,
    isRequestPending,
    isRequestFailed,
    getCollection,
  };
};
