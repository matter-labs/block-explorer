import useFetchCollection from "@/composables/common/useFetchCollection";
import useContext from "@/composables/useContext";

export type BatchListItem = Api.Response.BatchListItem;

export default (context = useContext()) => {
  return useFetchCollection<Api.Response.BatchListItem>(
    new URL(`${context.currentNetwork.value.apiUrl}/batches?toDate=${new Date().toISOString()}`)
  );
};
