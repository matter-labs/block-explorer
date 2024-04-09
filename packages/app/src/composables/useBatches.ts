import useFetchCollection from "@/composables/common/useFetchCollection";
import useContext from "@/composables/useContext";

export type BatchListItem = Api.Response.BatchListItem;

export default (context = useContext()) => {
  return useFetchCollection<Api.Response.BatchListItem>(
    new URL(`/batches?toDate=${new Date().toISOString()}`, context.currentNetwork.value.apiUrl)
  );
};
