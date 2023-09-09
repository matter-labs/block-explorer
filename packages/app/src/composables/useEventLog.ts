import { computed, ref } from "vue";

import useContext from "./useContext";
import useContractABI from "./useContractABI";

import type { Address, Hash } from "@/types";
import type { BigNumberish } from "ethers";

import { decodeLogWithABI } from "@/utils/helpers";

export type InputType = "string" | "address" | "bool" | "bytes" | "bytes32" | "uint256" | "uint8";
export type TransactionEvent = {
  name: string;
  inputs: {
    name: string;
    type: InputType;
    value: string;
  }[];
};

export type TransactionLogEntry = {
  address: Address;
  blockHash?: Hash;
  blockNumber: Hash | BigNumberish;
  data: Hash;
  l1BatchNumber?: Hash | null;
  logIndex: Hash;
  logType?: Hash | null;
  removed?: boolean;
  topics: string[];
  transactionHash: Hash;
  transactionIndex: Hash;
  transactionLogIndex?: Hash;
  event?: TransactionEvent;
};

export default (context = useContext()) => {
  const {
    collection: ABICollection,
    isRequestPending: isABIRequestPending,
    isRequestFailed: isABIRequestFailed,
    getCollection: getABICollection,
  } = useContractABI(context);
  const collection = ref<TransactionLogEntry[]>([]);

  const decodeEventLog = async (logs: TransactionLogEntry[]) => {
    const uniqueAddresses = Array.from(new Set(logs.map((log) => log.address)));
    await getABICollection(uniqueAddresses);
    collection.value = logs.map((log) => {
      try {
        const abi = ABICollection.value[log.address];
        return {
          ...log,
          event: abi ? decodeLogWithABI(log, abi) : undefined,
        };
      } catch {
        return log;
      }
    });
  };

  return {
    collection,
    isDecodePending: computed(() => isABIRequestPending.value),
    isDecodeFailed: computed(() => isABIRequestFailed.value),
    decodeEventLog,
  };
};
