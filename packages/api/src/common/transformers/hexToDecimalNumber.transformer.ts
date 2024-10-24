import { ValueTransformer } from "typeorm";

export const hexToDecimalNumberTransformer: ValueTransformer = {
  to(decimalNumberStr: string | null): string | null {
    if (!decimalNumberStr) {
      return null;
    }
    return `0x${BigInt(decimalNumberStr).toString(16)}`;
  },
  from(hexNumberStr: string | null): string | null {
    if (!hexNumberStr) {
      return null;
    }
    return BigInt(hexNumberStr).toString();
  },
};
