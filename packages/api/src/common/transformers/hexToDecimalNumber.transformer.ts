import { ValueTransformer } from "typeorm";
import { numberToHex } from "../utils";

export const hexToDecimalNumberTransformer: ValueTransformer = {
  to(decimalNumberStr: string | null): string | null {
    if (!decimalNumberStr) {
      return null;
    }
    return numberToHex(BigInt(decimalNumberStr));
  },
  from(hexNumberStr: string | null): string | null {
    if (!hexNumberStr) {
      return null;
    }
    return BigInt(hexNumberStr).toString();
  },
};
