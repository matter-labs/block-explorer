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
export function parseSignature(signature: string): ParsedSignature | null {
  if (!signature || typeof signature !== "string") {
    return null;
  }

  // Match function name and parameters
  const match = signature.match(/^(\w+)\((.*)\)$/);
  if (!match) {
    return null;
  }

  const [, name, paramsString] = match;

  // Handle empty parameters
  if (!paramsString.trim()) {
    return {
      name,
      inputs: [],
    };
  }

  // Parse parameter types
  const paramTypes = parseParameterTypes(paramsString);

  return {
    name,
    inputs: paramTypes.map((type, index) => ({
      type: type.trim(),
      name: `param${index}`, // Generic parameter names
    })),
  };
}

/**
 * Parse parameter types from a signature string, handling nested tuples
 * @param paramsString - Parameter string like "address,uint256" or "address,(uint256,bool),bytes"
 * @returns Array of parameter type strings
 */
function parseParameterTypes(paramsString: string): string[] {
  const params: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of paramsString) {
    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      // Only split on commas at depth 0 (not inside tuples)
      if (current.trim()) {
        params.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }

  // Add the last parameter
  if (current.trim()) {
    params.push(current.trim());
  }

  return params;
}
