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

      // Try to get both proxy and contract ABIs
      const [proxyInfo] = await Promise.all([
        getContractProxyInfo(transactionData.contractAddress),
        getABICollection([transactionData.contractAddress]),
      ]);

      if (isABIRequestFailed.value) {
        throw new Error("contract_request_failed");
      }

      let method: TransactionData["method"] | undefined;
      const contractAbi = ABICollection.value[transactionData.contractAddress];

      // Try decoding with contract's own ABI first if available
      if (contractAbi) {
        method = decodeDataWithABI(transactionData, contractAbi);
      }

      // If contract ABI didn't decode, try proxy implementation
      if (!method && proxyInfo?.implementation.verificationInfo) {
        method = decodeDataWithABI(transactionData, proxyInfo.implementation.verificationInfo.artifacts.abi);
      }

      // If we have neither ABI, it's not verified
      if (!contractAbi && !proxyInfo?.implementation.verificationInfo) {
        throw new Error("contract_not_verified");
      }

      // If we have either ABI but couldn't decode, it's a decoding failure
      if (!method) {
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
