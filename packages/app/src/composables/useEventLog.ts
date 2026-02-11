import { ref } from "vue";

import { FetchError } from "ohmyfetch";

import useContext from "./useContext";
import useContractABI from "./useContractABI";
import { FetchInstance } from "./useFetchInstance";
import { fetchEventNames } from "./useOpenChain";

import type { Address, Hash } from "@/types";
import type { BigNumberish } from "ethers";

import { checksumAddress } from "@/utils/formatters";
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
  const collection = ref<TransactionLogEntry[]>([]);
  const total = ref(0);
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);

  const { collection: ABICollection, getCollection: getABICollection } = useContractABI(context);

  const isDecodePending = ref(false);

  const getCollection = async (hash: string, page: number, pageSize: number) => {
    isRequestPending.value = true;
    isRequestFailed.value = false;

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("page", page.toString());
      searchParams.set("limit", pageSize.toString());

      const response = await FetchInstance.api(context)<Api.Response.Collection<Api.Response.Log>>(
        `/transactions/${hash}/logs?${searchParams.toString()}`
      );

      total.value = response.meta.totalItems;

      const logs: TransactionLogEntry[] = response.items.map((item) => ({
        address: checksumAddress(item.address),
        topics: item.topics,
        data: item.data as Address,
        blockNumber: BigInt(item.blockNumber),
        transactionHash: item.transactionHash as Address,
        transactionIndex: item.transactionIndex.toString(16) as Address,
        logIndex: item.logIndex.toString(16) as Address,
        event: undefined,
      }));

      // Decode logs
      isDecodePending.value = true;
      try {
        collection.value = await decodeLogs(logs);
      } finally {
        isDecodePending.value = false;
      }
    } catch (error: unknown) {
      if (!(error instanceof FetchError) || error.response?.status !== 404) {
        isRequestFailed.value = true;
      }
      collection.value = [];
      total.value = 0;
    } finally {
      isRequestPending.value = false;
    }
  };

  const decodeLogs = async (logs: TransactionLogEntry[]): Promise<TransactionLogEntry[]> => {
    const uniqueAddresses = Array.from(new Set(logs.map((log) => log.address)));
    await getABICollection(uniqueAddresses);

    // Decode with ABI (verified contracts) first
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

      return logsWithDecoding.map((log) => {
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
    }

    return logsWithDecoding;
  };

  return {
    collection,
    total,
    isRequestPending,
    isRequestFailed,
    isDecodePending,
    getCollection,
  };
};
