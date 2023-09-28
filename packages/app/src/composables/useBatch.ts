import { ref } from "vue";

import { $fetch, FetchError } from "ohmyfetch";

import useContext from "@/composables/useContext";

export type BatchDetails = Api.Response.BatchDetails & {
  isProvenByNewProver?: boolean;
};

export default (context = useContext()) => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const batchItem = ref(<null | BatchDetails>null);

  const getBatchNewProof = async (id: string) => {
    try {
      return await $fetch(`${context.currentNetwork.value.newProverUrl}/proof_${id}.bin`, { method: "HEAD" });
    } catch (error: unknown) {
      return null;
    }
  };

  const getById = async (id: string) => {
    isRequestPending.value = true;
    isRequestFailed.value = false;

    try {
      const batch = await $fetch(`${context.currentNetwork.value.apiUrl}/batches/${id}`);
      if (batch.proveTxHash) {
        const proof = await getBatchNewProof(id);
        batch.isProvenByNewProver = !!proof;
      }
      batchItem.value = batch;
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
    getBatchNewProof,
    getById,
    batchItem,
    isRequestPending,
    isRequestFailed,
  };
};
