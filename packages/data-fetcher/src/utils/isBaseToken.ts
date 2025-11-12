import { BASE_TOKEN_ADDRESS, ETH_ADDRESS_IN_CONTRACTS, ETH_L1_ADDRESS } from "../constants";

export default function isBaseToken(address: string) {
  return [BASE_TOKEN_ADDRESS, ETH_ADDRESS_IN_CONTRACTS, ETH_L1_ADDRESS].find(
    (a) => a.toLowerCase() === address.toLowerCase()
  );
}
