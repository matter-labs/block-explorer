import { z, type ZodTypeAny } from 'zod';
import type { Address } from 'viem';

export const hexSchema = z.string().regex(/^0x[0-9a-fA-F]*$/);
export type Hex = z.infer<typeof hexSchema>;
export const addressSchema = hexSchema
  .length(42)
  .transform((a) => a as Address);

export function enumeratedSchema<T extends ZodTypeAny>(parser: T) {
  return z.object({
    items: z.array(parser),
    meta: z.object({
      totalItems: z.number(),
      itemCount: z.number(),
      itemsPerPage: z.number(),
      totalPages: z.number(),
      currentPage: z.number(),
    }),
    links: z.object({
      first: z.string(),
      previous: z.string(),
      next: z.string(),
      last: z.string(),
    }),
  });
}
