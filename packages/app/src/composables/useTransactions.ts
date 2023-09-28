import useFetchCollection from "@/composables/common/useFetchCollection";
import useContext from "@/composables/useContext";

import type { ComputedRef } from "vue";

export type TransactionListItem = Api.Response.Transaction;
export type TransactionSearchParams = {
  l1BatchNumber?: number;
  blockNumber?: number;
  address?: string;
  fromDate?: string;
  toDate?: string;
};

export default (searchParams: ComputedRef<TransactionSearchParams>, context = useContext()) => {
  return useFetchCollection<TransactionListItem>(() => {
    const requestParams = Object.fromEntries(
      Object.entries(searchParams.value)
        .filter(([, value]) => !!value || value === 0)
        .map(([key, value]) => [key, value.toString()])
    );
    return new URL(`/transactions?${new URLSearchParams(requestParams)}`, context.currentNetwork.value.apiUrl);
  });
};
