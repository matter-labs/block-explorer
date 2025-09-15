import { ref } from "vue";

import { useMemoize } from "@vueuse/core";
import { FetchError } from "ohmyfetch";

import { FetchInstance } from "./useFetchInstance";

import useContext, { type Context } from "@/composables/useContext";

import type { AbiFragment, ContractVerificationInfoV2 } from "./useAddress";
import type { Address } from "@/types";

import { checksumAddress } from "@/utils/formatters";

const retrieveAddressInfo = useMemoize(
  async (address: Address, context: Context = useContext()) => {
    const { status, message, result } = await FetchInstance.api(context)<{
      status: string;
      message: string;
      result: ContractVerificationInfoV2[];
    }>(`/api/contract/getsourcecode?address=${address}`);
    if (status !== "1") {
      console.log("failed to load contract verification info", status, message);
      return null;
    }
    result[0].contractAddress = address;
    return result[0];
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
    ).filter((contract) => contract !== null) as ContractVerificationInfoV2[];
    collection.value = Object.fromEntries(
      verifiedContracts.map((verificationInfo) => [
        checksumAddress(verificationInfo.contractAddress),
        verificationInfo.ABI,
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
