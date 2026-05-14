import useFetchCollection from "@/composables/common/useFetchCollection";
import useContext from "@/composables/useContext";
import { getTransferNetworkOrigin } from "@/composables/useTransaction";

import type { NetworkOrigin } from "@/types";
import type { ComputedRef } from "vue";

export type Transfer = Api.Response.Transfer & {
  fromNetwork: NetworkOrigin;
  toNetwork: NetworkOrigin;
};

export default (address: ComputedRef<string>, context = useContext()) => {
  return useFetchCollection<Transfer, Api.Response.Transfer>(
    () => new URL(`/address/${address.value}/transfers`, context.currentNetwork.value.apiUrl),
    (transfer: Api.Response.Transfer): Transfer => ({
      ...transfer,
      token: transfer.token || {
        l2Address: transfer.tokenAddress,
        l1Address: null,
        name: null,
        symbol: null,
        decimals: 0,
        usdPrice: null,
        liquidity: null,
        iconURL: null,
      },
      fromNetwork: getTransferNetworkOrigin(transfer, "from", context.currentNetwork.value.l1ChainId),
      toNetwork: getTransferNetworkOrigin(transfer, "to", context.currentNetwork.value.l1ChainId),
    })
  );
};
