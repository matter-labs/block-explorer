import { utils } from "zksync-web3";
export const isNativeToken = (tokenAddress: string): boolean => {
  const isL1ERC20 = tokenAddress.toLowerCase() === utils.L2_ETH_TOKEN_ADDRESS.toLowerCase();
  const isEth = tokenAddress === "0x0000000000000000000000000000000000000001";
  return isEth || isL1ERC20;
};
