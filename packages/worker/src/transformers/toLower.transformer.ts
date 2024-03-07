import { ValueTransformer } from "typeorm";

export const toLowerTransformer: ValueTransformer = {
  to(str: string | null): string | null {
    if (!str) {
      return null;
    }
    return str.toLowerCase();
  },
  from(str: string): string {
    return str;
  },
};
