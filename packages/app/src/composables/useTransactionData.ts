import { ref } from "vue";

import { AbiCoder, Interface } from "ethers";

import useAddress from "./useAddress";
import useContext from "./useContext";
import useContractABI from "./useContractABI";

import type { AbiFragment } from "./useAddress";
import type { InputType } from "./useEventLog";
import type { Address } from "@/types";
import type { ParamType, Result } from "ethers";

const defaultAbiCoder: AbiCoder = AbiCoder.defaultAbiCoder();

export enum InputComponentType {
  TUPLE = "tuple",
  ARRAY = "array",
  BASE = "base",
}

export type MethodData = {
  name: string;
  inputs: InputData[];
};

export type InputData = {
  name: string;
  type: InputType | string;
  value: string;
  inputs: InputData[];
  inputComponentType: InputComponentType;
  encodedValue: string;
};
export type TransactionData = {
  calldata: string;
  contractAddress: Address;
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

export function decodeInputData(input: ParamType, args: Result): InputData[] {
  if (!input) {
    throw new Error("input_is_null");
  }

  if (input.isArray()) {
    return decodeArrayInputData(input, args);
  }

  if (input.isTuple()) {
    return decodeTupleInputData(input, args);
  }

  return [
    {
      name: input.name,
      type: input.type as InputType,
      value: args.toString(),
      encodedValue: defaultAbiCoder.encode([input.type], [args]).split("0x")[1],
      inputs: [],
      inputComponentType: InputComponentType.BASE,
    },
  ];
}

function decodeArrayInputData(input: ParamType, args: Result): InputData[] {
  const inputs = args.flatMap((arg) => decodeInputData(input.arrayChildren!, arg));

  return [
    {
      name: input.name,
      type: `${inputs[0]?.type ? `${inputs[0]?.type}[]` : input.type}`,
      value: joinArrayValues(
        inputs.map((input) => input.value),
        "[",
        "]"
      ),
      inputs: inputs,
      encodedValue: joinArrayValues(
        inputs.map((input) => input.encodedValue),
        "[",
        "]"
      ),
      inputComponentType: InputComponentType.ARRAY,
    },
  ];
}

function decodeTupleInputData(input: ParamType, args: Result): InputData[] {
  const inputs = input.components!.flatMap((component: ParamType, index: number) =>
    decodeInputData(component, args[index])
  );

  return [
    {
      name: input.name,
      type: joinArrayValues(
        inputs.map((input) => input.type),
        "tuple(",
        ")"
      ),
      value: joinArrayValues(
        inputs.map((input) => input.value),
        "(",
        ")"
      ),
      inputs,
      encodedValue: joinArrayValues(
        inputs.map((input) => input.encodedValue),
        "(",
        ")"
      ),
      inputComponentType: InputComponentType.TUPLE,
    },
  ];
}

function joinArrayValues(inputs: string[], prefix = "", suffix = ""): string {
  return `${prefix}${inputs.join(",")}${suffix}`;
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
