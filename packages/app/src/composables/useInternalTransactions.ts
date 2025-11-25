import { computed, type ComputedRef, ref } from "vue";

import useContext from "@/composables/useContext";
import { FetchInstance } from "@/composables/useFetchInstance";

export type InternalTransaction = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  input: string;
  type: string;
  contractAddress: string;
  gasUsed: string;
  fee: string;
  traceId: string;
  transactionType: string;
  isError: string;
  errCode: string;
};

type InternalTransactionsResponse = {
  status: string;
  message: string;
  result: InternalTransaction[];
};

export default (address: ComputedRef<string>, context = useContext()) => {
  const data = ref<InternalTransaction[]>([]);
  const pending = ref(false);
  const failed = ref(false);
  const pageSize = ref(10);
  const page = ref(1);
  const total = ref<number | null>(null); // Total is not returned by this API

  const load = async (nextPage: number, _toDate?: Date, updatedPageSize?: number) => {
    page.value = nextPage;
    if (updatedPageSize) {
      pageSize.value = updatedPageSize;
    }

    pending.value = true;
    failed.value = false;

    try {
      const url = new URL(`/api/account/txlistinternal`, context.currentNetwork.value.apiUrl);
      url.searchParams.set("address", address.value);
      url.searchParams.set("page", page.value.toString());
      url.searchParams.set("offset", pageSize.value.toString());
      url.searchParams.set("sort", "desc");

      const response = await FetchInstance.api(context)<InternalTransactionsResponse>(url.toString());

      if (response.status === "1" && Array.isArray(response.result)) {
        data.value = response.result;
      } else {
        data.value = [];
        if (response.message !== "No transactions found") {
          // If it's just no transactions, it's not a failure
          if (response.status === "0" && response.message !== "No transactions found") {
            failed.value = true;
          }
        }
      }
    } catch (error) {
      failed.value = true;
      data.value = [];
    } finally {
      pending.value = false;
    }
  };

  return {
    data: computed(() => data.value),
    pending: computed(() => pending.value),
    failed: computed(() => failed.value),
    pageSize: computed(() => pageSize.value),
    page: computed(() => page.value),
    total: computed(() => total.value),
    load,
  };
};
