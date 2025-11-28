import { computed, ref } from "vue";

import useContext from "./useContext";
import useContractABI from "./useContractABI";
import { fetchEventNames } from "./useOpenChain";

import type { Address, Hash } from "@/types";
import type { BigNumberish } from "ethers";

import { decodeLogWithABI } from "@/utils/helpers";
import { parseEventSignature } from "@/utils/parseSignature";

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

    // decode with ABI (verified contracts) first
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

    // For logs that couldn't be decoded with ABI (unverified contracts), try OpenChain
    const logsWithoutEvents = logsWithDecoding.filter((log) => !log.event && log.topics.length > 0);

    if (logsWithoutEvents.length > 0) {
      const topicHashes = Array.from(new Set(logsWithoutEvents.map((log) => log.topics[0])));
      const signatureMap = await fetchEventNames(topicHashes);

      collection.value = logsWithDecoding.map((log) => {
        if (log.event) {
          return log;
        }
        if (!log.topics || log.topics.length === 0) {
          return log;
        }

        // Try to get signature from OpenChain
        const signature = signatureMap[log.topics[0]];
        if (signature) {
          const parsedSig = parseEventSignature(signature);
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
