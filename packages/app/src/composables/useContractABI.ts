import { ref } from "vue";

import { useMemoize } from "@vueuse/core";
import { $fetch, FetchError } from "ohmyfetch";

import useContext, { type Context } from "@/composables/useContext";

import type { AbiFragment, ContractVerificationInfo } from "./useAddress";
import type { Address } from "@/types";

import { checksumAddress } from "@/utils/formatters";

const retrieveAddressInfo = useMemoize(
  async (address: Address, context: Context = useContext()) => {
    if (!context.currentNetwork.value.verificationApiUrl) {
      return null;
    }
    return await $fetch(`${context.currentNetwork.value.verificationApiUrl}/contract_verification/info/${address}`);
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
    const verifiedContracts = (
      await Promise.all(
        addresses.map((address) =>
          retrieveAddressInfo(address, context).catch((error) => {
            if (!(error instanceof FetchError) || error.response?.status !== 404) {
              isRequestFailed.value = true;
            }
            return null;
          })
        )
      )
    ).filter((contract) => contract !== null) as ContractVerificationInfo[];
    collection.value = Object.fromEntries(
      verifiedContracts.map((verificationInfo) => [
        checksumAddress(verificationInfo.request.contractAddress),
        verificationInfo.artifacts.abi,
      ])
    );
    isRequestPending.value = false;
  };

  return {
    collection,
    isRequestPending,
    isRequestFailed,
    getCollection,
  };
};
