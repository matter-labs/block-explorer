import { BASE_TOKEN_ADDRESS } from "src/constants";
export const isBaseToken = (tokenAddress: string): boolean => {
  return BASE_TOKEN_ADDRESS.toLowerCase() === tokenAddress.toLowerCase();
};
