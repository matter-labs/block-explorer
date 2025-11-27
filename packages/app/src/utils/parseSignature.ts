import { FunctionFragment } from "ethers";

/**
 * Parse a function signature string from OpenChain/Sourcify into structured format
 * Example: "transfer(address,uint256)" -> { name: "transfer", inputs: [...] }
 */

export interface ParsedSignature {
  name: string;
  inputs: Array<{
    type: string;
    name: string;
  }>;
}

/**
 * Parse a function signature string into a structured format
 * @param signature - Function signature like "transfer(address,uint256)"
 * @returns Parsed signature object or null if invalid
 */
export function parseFunctionSignature(signature: string): ParsedSignature | null {
  if (!signature || typeof signature !== "string") {
    return null;
  }

  try {
    const fragment = FunctionFragment.from(signature);
    return {
      name: fragment.name,
      inputs: fragment.inputs.map((input, index) => ({
        type: input.type,
        name: input.name || `param${index}`,
      })),
    };
  } catch {
    return null;
  }
}
