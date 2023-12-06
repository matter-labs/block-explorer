import { BigNumber } from "ethers";
import { ValueTransformer } from "typeorm";

export const hexToDecimalNumberTransformer: ValueTransformer = {
  to(decimalNumberStr: string | null): string | null {
    if (!decimalNumberStr) {
      return null;
    }
    return BigNumber.from(decimalNumberStr).toHexString();
  },
  from(hexNumberStr: string | null): string | null {
    if (!hexNumberStr) {
      return null;
    }
    return BigNumber.from(hexNumberStr).toString();
  },
};
