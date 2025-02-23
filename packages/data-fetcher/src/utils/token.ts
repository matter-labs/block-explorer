import { BASE_TOKEN_ADDRESS } from "../constants";
export const isBaseToken = (tokenAddress: string): boolean => {
  return BASE_TOKEN_ADDRESS.toLowerCase() === tokenAddress.toLowerCase();
};
