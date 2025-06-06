import { ref } from "vue";

import { Interface } from "ethers";

import useAddress from "./useAddress";
import useContext from "./useContext";
import useContractABI from "./useContractABI";

import type { AbiFragment } from "./useAddress";
import type { InputType } from "./useEventLog";
import type { Address } from "@/types";

import { decodeInputData } from "@/utils/helpers";

export type MethodData = {
  name: string;
  inputs: InputData[];
};

export type InputData = {
  name: string;
  type: InputType | string;
  value: string;
  inputs: InputData[];
  encodedValue: string;
};
export type TransactionData = {
  calldata: string;
  contractAddress: Address | null;
  value: string;
  sighash: string;
  method?: MethodData;
};

export function decodeDataWithABI(
  transactionData: { calldata: TransactionData["calldata"]; value: TransactionData["value"] },
  abi: AbiFragment[]
): TransactionData["method"] | undefined {
  const contractInterface = new Interface(abi);
  try {
    const decodedData = contractInterface.parseTransaction({
      data: transactionData.calldata,
      value: transactionData.value,
    })!;
    return {
      name: decodedData.name,
      inputs: decodedData.fragment.inputs.flatMap((input) => decodeInputData(input, decodedData.args[input.name])),
    };
  } catch {
    return undefined;
  }
}

export default (context = useContext()) => {
  const {
    collection: ABICollection,
    isRequestFailed: isABIRequestFailed,
    getCollection: getABICollection,
  } = useContractABI(context);
  const { getContractProxyInfo } = useAddress(context);
  const data = ref<TransactionData | null>(null);
  const isDecodePending = ref(false);
  const decodingError = ref("");

  const decodeTransactionData = async (transactionData: TransactionData) => {
    if (transactionData.calldata === "0x" || !transactionData.contractAddress) {
      data.value = transactionData;
      decodingError.value = "";
      return;
    }

    try {
      isDecodePending.value = true;
      decodingError.value = "";
      await getABICollection([transactionData.contractAddress]);
      const abi = ABICollection.value[transactionData.contractAddress];

      if (isABIRequestFailed.value) {
        throw new Error("contract_request_failed");
      }

      if (!abi) {
        throw new Error("contract_not_verified");
      }

      let method = abi ? decodeDataWithABI(transactionData, abi) : undefined;
      if (!method) {
        const proxyInfo = await getContractProxyInfo(transactionData.contractAddress);
        if (proxyInfo?.implementation.verificationInfo) {
          method = decodeDataWithABI(transactionData, proxyInfo.implementation.verificationInfo.artifacts.abi);
        }
      }

      if (abi && !method) {
        throw new Error("data_decode_failed");
      }

      data.value = {
        ...transactionData,
        method,
      };
    } catch (error) {
      decodingError.value = (error as Error)?.toString().replace(/^Error: /, "") || "unknown_error";
      data.value = transactionData;
    } finally {
      isDecodePending.value = false;
    }
  };

  return {
    data,
    isDecodePending,
    decodingError,
    decodeTransactionData,
  };
};
