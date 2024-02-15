import { ValueTransformer } from "typeorm";

export const stringTransformer: ValueTransformer = {
  to(str: string | null): string | null {
    if (!str) {
      return str;
    }
    // remove zero bytes as postgres can't store them in string
    return str.replace(/\0/g, "");
  },
  from(str: string): string {
    return str;
  },
};
