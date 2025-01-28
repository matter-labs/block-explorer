import useFetchCollection from "./common/useFetchCollection";
import useContext from "./useContext";

export type TokenHolder = Api.Response.TokenHolder;

export default (tokenAddress: string, context = useContext()) => {
  return useFetchCollection<Api.Response.TokenHolder>(
    new URL(`/tokens/${tokenAddress}/holders`, context.currentNetwork.value.apiUrl)
  );
};
