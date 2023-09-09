import { ValueTransformer } from "typeorm";
import { FindOperator } from "typeorm";

export const hexTransformer: ValueTransformer = {
  to(value: string | FindOperator<any> | null): Buffer | FindOperator<any> | null {
    if (!value) {
      return null;
    }

    if (value instanceof FindOperator<any>) {
      return value;
    }

    return Buffer.from(value.startsWith("0x") ? value.substring(2) : value, "hex");
  },
  from(hex: Buffer): string {
    if (!hex) {
      return null;
    }
    return `0x${hex.toString("hex")}`;
  },
};
