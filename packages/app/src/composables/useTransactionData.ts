import { ref } from "vue";

import { AbiCoder, Interface } from "ethers";

import useAddress from "./useAddress";
import useContext from "./useContext";
import useContractABI from "./useContractABI";

import type { AbiFragment } from "./useAddress";
import type { InputType } from "./useEventLog";
import type { Address } from "@/types";

const defaultAbiCoder: AbiCoder = AbiCoder.defaultAbiCoder();

export type TransactionData = {
  calldata: string;
  contractAddress: Address;
  value: string;
  sighash: string;
  method?: {
    name: string;
    inputs: {
      name: string;
      type: InputType;
      value: string;
      encodedValue: string;
    }[];
  };
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
      inputs: decodedData.fragment.inputs.map((input) => ({
        name: input.name,
        type: input.type as InputType,
        value: decodedData.args[input.name]?.toString(),
        encodedValue: defaultAbiCoder.encode([input.type], [decodedData.args[input.name]]).split("0x")[1],
      })),
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
    if (transactionData.calldata === "0x") {
      data.value = transactionData;
      decodingError.value = "";
      return;
    }

    try {
      isDecodePending.value = true;
      decodingError.value = "";
      await getABICollection([transactionData.contractAddress]);
      const abi = ABICollection.value[transactionData.contractAddress];
      if (!abi) {
        if (!isABIRequestFailed.value) {
          throw "contract_not_verified";
        }
        throw "contract_request_failed";
      }
      let method = abi ? decodeDataWithABI(transactionData, abi) : undefined;
      if (!method) {
        const proxyInfo = await getContractProxyInfo(transactionData.contractAddress);
        method = proxyInfo?.implementation.verificationInfo
          ? decodeDataWithABI(transactionData, proxyInfo.implementation.verificationInfo.artifacts.abi)
          : undefined;
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
