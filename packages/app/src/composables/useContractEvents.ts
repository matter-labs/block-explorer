import { ref } from "vue";

import { $fetch, FetchError } from "ohmyfetch";

import useContext from "@/composables/useContext";

import type { AbiFragment } from "@/composables/useAddress";
import type { TransactionLogEntry } from "@/composables/useEventLog";
import type { Address } from "@/types";

import { checksumAddress } from "@/utils/formatters";
import { decodeLogWithABI } from "@/utils/helpers";

export type EventsQueryParams = {
  contractAddress: Address;
  page: number;
  pageSize: number;

  toDate?: Date;
};

type Log = {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash?: string;
  transactionIndex: number;
  logIndex: number;
};

export default (context = useContext()) => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const collection = ref<TransactionLogEntry[]>([]);
  const total = ref<number>(0);

  const getCollection = async (params: EventsQueryParams, abi?: AbiFragment[]) => {
    isRequestPending.value = true;
    isRequestFailed.value = false;

    try {
      const url = new URL(`/address/${params.contractAddress}/logs`, context.currentNetwork.value.apiUrl);
      if (params.toDate && +new Date(params.toDate) > 0) {
        url.searchParams.set("toDate", params.toDate.toISOString());
      }
      if (params.page > 0) {
        url.searchParams.set("page", params.page.toString());
      }
      if (params.pageSize > 0) {
        url.searchParams.set("limit", params.pageSize.toString());
      }

      const response = await $fetch<Api.Response.Collection<Log>>(url.toString());

      collection.value = response.items.map((e) => {
        const item: TransactionLogEntry = {
          address: checksumAddress(e.address),
          topics: e.topics,
          data: e.data as Address,
          blockNumber: BigInt(e.blockNumber),
          transactionHash: e.transactionHash as Address,
          transactionIndex: e.transactionIndex.toString(16) as Address,
          logIndex: e.logIndex.toString(16) as Address,

          event: undefined,
        };
        if (abi) {
          item.event = decodeLogWithABI(item, abi);
        }
        return item;
      });

      total.value = response.meta.totalItems;
    } catch (error: unknown) {
      if (!(error instanceof FetchError) || error.response?.status !== 404) {
        isRequestFailed.value = true;
      }
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    total,
    collection,
    getCollection,
    isRequestPending,
    isRequestFailed,
  };
};
