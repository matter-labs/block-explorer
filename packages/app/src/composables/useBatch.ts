import { ref } from "vue";

import { $fetch, FetchError } from "ohmyfetch";

import useContext from "@/composables/useContext";

export type BatchDetails = Api.Response.BatchDetails;

export default (context = useContext()) => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const batchItem = ref(<null | BatchDetails>null);

  const getById = async (id: string) => {
    isRequestPending.value = true;
    isRequestFailed.value = false;

    try {
      batchItem.value = await $fetch(`${context.currentNetwork.value.apiUrl}/batches/${id}`);
    } catch (error: unknown) {
      batchItem.value = null;
      if (!(error instanceof FetchError) || error.response?.status !== 404) {
        isRequestFailed.value = true;
      }
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    getById,
    batchItem,
    isRequestPending,
    isRequestFailed,
  };
};
