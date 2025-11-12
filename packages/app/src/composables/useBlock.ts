import { ref } from "vue";

import { FetchError } from "ohmyfetch";

import { FetchInstance } from "./useFetchInstance";

import useContext from "@/composables/useContext";

import type { Hash } from "@/types";

export type BlockStatus = "sealed" | "committed" | "proven" | "executed";
export type Block = {
  number: number;
  status: BlockStatus;
  hash: Hash;
  l1TxCount: number;
  l2TxCount: number;
  timestamp: string;
};

export type BlockListItem = {
  number: number;
  hash: Hash;
  timestamp: string;
  gasUsed: string;
  l1TxCount: number;
  l2TxCount: number;
  size: number;
  status: BlockStatus;
};

export default (context = useContext()) => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const blockItem = ref(<null | Block>null);

  const getById = async (id: string) => {
    isRequestPending.value = true;
    isRequestFailed.value = false;

    try {
      blockItem.value = await FetchInstance.api(context)(`/blocks/${id}`);
    } catch (error: unknown) {
      blockItem.value = null;
      if (!(error instanceof FetchError) || error.response?.status !== 404) {
        isRequestFailed.value = true;
      }
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    getById,
    blockItem,
    isRequestPending,
    isRequestFailed,
  };
};
