import useFetch from "./common/useFetch";
import useContext from "./useContext";

export interface NetworkStats {
  lastSealedBatch: number;
  lastVerifiedBatch: number;
  lastSealedBlock: number;
  lastVerifiedBlock: number;
  totalTransactions: number;
}

export default (context = useContext()) => {
  return useFetch<NetworkStats>(() => new URL(`${context.currentNetwork.value.apiUrl}/stats`));
};
