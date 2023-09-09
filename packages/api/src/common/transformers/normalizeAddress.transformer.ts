import { utils } from "ethers";
import { ValueTransformer } from "typeorm";
import { hexTransformer } from "./hex.transformer";

export const normalizeAddressTransformer: ValueTransformer = {
  to(str: string): Buffer {
    return hexTransformer.to(str);
  },
  from(hex: Buffer): string {
    if (!hex) {
      return null;
    }
    return utils.getAddress(hexTransformer.from(hex));
  },
};
