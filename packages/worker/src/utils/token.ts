import { utils } from "zksync-web3";
export const isNativeToken = (tokenAddress: string): boolean => {
  return tokenAddress.toLowerCase() === utils.L2_ETH_TOKEN_ADDRESS.toLowerCase();
};
