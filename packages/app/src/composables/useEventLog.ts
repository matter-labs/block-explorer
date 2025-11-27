import { computed, ref } from "vue";

import useContext from "./useContext";
import useContractABI from "./useContractABI";
import { fetchEventNames } from "./useOpenChain";

import type { Address, Hash } from "@/types";
import type { BigNumberish } from "ethers";

import { decodeLogWithABI } from "@/utils/helpers";
import { parseSignature } from "@/utils/parseSignature";

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
  logIndex: Hash;
  logType?: Hash | null;
  removed?: boolean;
  topics: string[];
  transactionHash: Hash;
  transactionIndex: Hash;
  transactionLogIndex?: Hash;
  event?: TransactionEvent;
  signature?: string;
  isPartialDecoding?: boolean;
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

    // First pass: try to decode with ABIs
    const logsWithDecoding = logs.map((log) => {
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

    // Second pass: for logs without events, try OpenChain
    const logsWithoutEvents = logsWithDecoding.filter((log) => !log.event && log.topics.length > 0);

    if (logsWithoutEvents.length > 0) {
      // Extract unique topic hashes (topics[0] is the event signature hash)
      const topicHashes = Array.from(new Set(logsWithoutEvents.map((log) => log.topics[0])));
      const signatureMap = await fetchEventNames(topicHashes);

      // Update logs with OpenChain signatures
      collection.value = logsWithDecoding.map((log) => {
        // If already has an event, keep it
        if (log.event) {
          return log;
        }

        // If no topics, return as-is
        if (!log.topics || log.topics.length === 0) {
          return log;
        }

        // Try to get signature from OpenChain
        const signature = signatureMap[log.topics[0]];
        if (signature) {
          const parsedSig = parseSignature(signature);
          if (parsedSig) {
            return {
              ...log,
              signature,
              isPartialDecoding: true,
              event: {
                name: parsedSig.name,
                inputs: parsedSig.inputs.map((input) => ({
                  name: input.name,
                  type: input.type as InputType,
                  value: "Unable to decode without ABI",
                })),
              },
            };
          }
        }

        return log;
      });
    } else {
      collection.value = logsWithDecoding;
    }
  };

  return {
    collection,
    isDecodePending: computed(() => isABIRequestPending.value),
    isDecodeFailed: computed(() => isABIRequestFailed.value),
    decodeEventLog,
  };
};
