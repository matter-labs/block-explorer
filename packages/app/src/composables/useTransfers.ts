import useFetchCollection from "@/composables/common/useFetchCollection";
import useContext from "@/composables/useContext";

import type { NetworkOrigin } from "@/types";
import type { ComputedRef } from "vue";

export type Transfer = Api.Response.Transfer & {
  fromNetwork: NetworkOrigin;
  toNetwork: NetworkOrigin;
};

export default (address: ComputedRef<string>, context = useContext()) => {
  return useFetchCollection<Transfer, Api.Response.Transfer>(
    () =>
      new URL(
        `/address/${address.value}/transfers?toDate=${new Date().toISOString()}`,
        context.currentNetwork.value.apiURLv2
      ),
    (transfer: Api.Response.Transfer): Transfer => ({
      ...transfer,
      fromNetwork: transfer.type === "deposit" ? "L1" : "L2",
      toNetwork: transfer.type === "withdrawal" ? "L1" : "L2",
    })
  );
};
