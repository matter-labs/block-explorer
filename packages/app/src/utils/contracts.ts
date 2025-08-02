import { id } from "ethers";

import type { AbiFragment } from "@/composables/useAddress";

/**
 * Calculates the function selector for a given ABI fragment
 * @param abiFragment - The ABI fragment containing function information
 * @returns The 4-byte function selector as a hex string (e.g., "0x12345678")
 */
export function getFunctionSelector(abiFragment: AbiFragment): string {
  // Build the function signature
  const inputs = abiFragment.inputs.map((input) => input.type).join(",");
  const signature = `${abiFragment.name}(${inputs})`;

  // Calculate the keccak256 hash and take the first 4 bytes (8 hex chars)
  const hash = id(signature);
  return hash.slice(0, 10); // "0x" + 8 hex chars = 10 chars total
}
