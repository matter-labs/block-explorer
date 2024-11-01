import { z } from 'zod';
import type { Address } from 'viem';

export const hexSchema = z.string().regex(/^0x[0-9a-fA-F]*$/);
export type Hex = z.infer<typeof hexSchema>;
export const addressSchema = hexSchema
  .length(42)
  .transform((a) => a as Address);
