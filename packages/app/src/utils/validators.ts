import { AbiCoder, isAddress as ethersIsAddress } from "ethers";

const defaultAbiCoder: AbiCoder = AbiCoder.defaultAbiCoder();

export function isSNS(s: string) {
  return !s.endsWith(".eth") && (s.endsWith(".soph.id") || !isAddress(s));
}

export function isAddress(address: string): boolean {
  return ethersIsAddress(address?.toLowerCase());
}

export const isTransactionHash = (s: string) => {
  return /^0x([A-Fa-f0-9]{64})$/.test(s);
};

export const isBlockNumber = (s: number | string) => {
  const n = Number(s);
  return /^[0-9*+-]+$/.test(s?.toString()) && n >= 0 && n <= Number.MAX_SAFE_INTEGER;
};

export const validateAbiValue = (value: string, type: string) => {
  try {
    /* Will throw an error in case if it is impossible to encode the value to required type */
    if (type === "bool") {
      // Handle bool type specially
      const lowerValue = value.toLowerCase().trim();
      if (["true", "false", "0", "1", "[true]", "[false]"].includes(lowerValue)) {
        const boolValue = ["true", "1", "[true]"].includes(lowerValue);
        defaultAbiCoder.encode([type], [boolValue]);
      } else {
        return false;
      }
    } else {
      defaultAbiCoder.encode([type], [value]);
    }
  } catch {
    return false;
  }
  return true;
};
