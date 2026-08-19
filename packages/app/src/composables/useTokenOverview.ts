import { ref } from "vue";

import { Contract as EthersContract } from "ethers";

import useContext from "./useContext";

import type { Hash } from "@/types";

import { ERC20_ABI } from "@/utils/constants";

export type TokenOverview = {
  totalSupply: number;
};

export default () => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const tokenOverview = ref(null as TokenOverview | null);

  const getTokenOverview = async (address: Hash, context = useContext()) => {
    tokenOverview.value = null;
    isRequestFailed.value = false;
    isRequestPending.value = true;

    try {
      const provider = context.getL2Provider();
      const contract = new EthersContract(address, ERC20_ABI, provider);
      // Prividium authorizes eth_call against the caller's wallet and rejects calls with
      // no `from`, so the read is made as the logged in user when there is one.
      const user = context.user.value;
      const totalSupply = await contract.totalSupply(user.loggedIn ? { from: user.address } : {});
      tokenOverview.value = {
        totalSupply,
      };
    } catch (err) {
      isRequestFailed.value = true;
    } finally {
      isRequestPending.value = false;
    }
  };

  return {
    isRequestPending,
    isRequestFailed,
    tokenOverview,
    getTokenOverview,
  };
};
