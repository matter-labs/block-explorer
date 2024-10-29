import { AbiCoder, isAddress as ethersIsAddress } from "ethers";

const defaultAbiCoder: AbiCoder = AbiCoder.defaultAbiCoder();

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
    defaultAbiCoder.encode([type], [value]);
  } catch {
    return false;
  }
  return true;
};
