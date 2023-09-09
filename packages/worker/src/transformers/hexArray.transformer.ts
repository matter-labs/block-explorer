import { ValueTransformer } from "typeorm";
import { hexTransformer } from "./hex.transformer";

export const hexArrayTransformer: ValueTransformer = {
  to(values: string[] | null): Buffer[] | null {
    if (!values) {
      return null;
    }

    return values.map(hexTransformer.to);
  },
  from(hexValues: Buffer[]): string[] {
    if (!hexValues) {
      return null;
    }
    return hexValues.map(hexTransformer.from);
  },
};
