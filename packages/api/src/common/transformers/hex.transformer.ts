import { ValueTransformer } from "typeorm";

export const hexTransformer: ValueTransformer = {
  to(str: string | null): Buffer | null {
    if (!str) {
      return null;
    }
    return Buffer.from(str.startsWith("0x") ? str.substring(2) : str, "hex");
  },
  from(hex: Buffer): string {
    if (!hex) {
      return null;
    }
    return `0x${hex.toString("hex")}`;
  },
};
