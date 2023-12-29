import { ValueTransformer } from "typeorm";

export const stringDateTransformer: ValueTransformer = {
  to(strDate: string | null): Date | null {
    if (!strDate) {
      return null;
    }
    return new Date(strDate);
  },
  from(date: Date | null): string | null {
    if (!date) {
      return null;
    }
    return date.toISOString();
  },
};
