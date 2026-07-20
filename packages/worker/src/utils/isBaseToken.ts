import { BASE_TOKEN_L2_ADDRESS, ETH_ADDRESS_IN_CONTRACTS, ZERO_ADDRESS } from "../constants";

export default function isBaseToken(address: string) {
  return [BASE_TOKEN_L2_ADDRESS, ETH_ADDRESS_IN_CONTRACTS, ZERO_ADDRESS].find(
    (a) => a.toLowerCase() === address.toLowerCase()
  );
}
