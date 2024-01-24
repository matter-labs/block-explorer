import { utils } from "zksync-web3";
export const isNativeToken = (tokenAddress: string): boolean => {
  return tokenAddress === utils.L2_ETH_TOKEN_ADDRESS;
};
