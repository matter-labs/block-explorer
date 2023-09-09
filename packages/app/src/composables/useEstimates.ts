import { ref } from "vue";

export interface Cost {
  label: string;
  value: number;
  description?: string;
}

export default () => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const costs = ref(null as Cost[] | null);

  const getEstimatedCosts = async () => {
    isRequestPending.value = true;
    try {
      isRequestFailed.value = false;

      costs.value = await [
        {
          label: "Activation Fee",
          value: 44.5,
          description: "Description",
        },
        {
          label: "Transfer",
          value: 0.76,
        },
        {
          label: "MintNFT",
          value: 25,
        },
        {
          label: "Withdraw",
          value: 63,
        },
      ];
    } catch (error) {
      isRequestFailed.value = true;
      costs.value = null;
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    getEstimatedCosts,
    isRequestPending,
    isRequestFailed,
    costs,
  };
};
