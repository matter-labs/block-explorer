import useFetchCollection from "@/composables/common/useFetchCollection";
import useContext from "@/composables/useContext";

import type { BlockListItem } from "@/composables/useBlock";

export default (context = useContext()) => {
  return useFetchCollection<BlockListItem>(
    new URL(`/blocks?toDate=${new Date().toISOString()}`, context.currentNetwork.value.apiUrl)
  );
};
