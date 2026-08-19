import { ref } from "vue";

import { type BigNumberish, Contract as EthersContract } from "ethers";

import useContext from "./useContext";
import { FetchInstance } from "./useFetchInstance";

import type { Context } from "./useContext";
import type { Hash } from "@/types";

import { ERC20_ABI } from "@/utils/constants";

export type TokenOverview = {
  totalSupply: BigNumberish;
};

function getTotalSupply(address: Hash, context: Context) {
  const provider = context.getL2Provider();
  const contract = new EthersContract(address, ERC20_ABI, provider);
  return contract.totalSupply();
}

// Prividium authorizes eth_call per user and the browser holds no session token, so the
// supply is read through the explorer API, which calls the RPC on the user's behalf.
async function getPrividiumTotalSupply(address: Hash, context: Context) {
  const { totalSupply } = await FetchInstance.api(context)<{ totalSupply: string | null }>(
    `/tokens/${address}/total-supply`
  );
  return totalSupply;
}

export default () => {
  const isRequestPending = ref(false);
  const isRequestFailed = ref(false);
  const tokenOverview = ref(null as TokenOverview | null);

  const getTokenOverview = async (address: Hash, context = useContext()) => {
    tokenOverview.value = null;
    isRequestFailed.value = false;
    isRequestPending.value = true;

    try {
      const totalSupply = context.currentNetwork.value.prividium
        ? await getPrividiumTotalSupply(address, context)
        : await getTotalSupply(address, context);
      tokenOverview.value = totalSupply === null ? null : { totalSupply };
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
