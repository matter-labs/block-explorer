import { ValueTransformer } from "typeorm";

export const bigIntNumberTransformer: ValueTransformer = {
  to(number: number): number {
    return number;
  },
  from(bigIntStr: string | null): number | null {
    if (!bigIntStr) {
      return null;
    }
    return parseInt(bigIntStr, 10);
  },
};
