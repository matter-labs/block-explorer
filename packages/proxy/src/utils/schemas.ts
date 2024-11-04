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

export const tokenSchema = z.object({
  l2Address: hexSchema,
  l1Address: hexSchema,
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  usdPrice: z.number(),
  liquidity: z.number(),
  iconURL: z.string(),
});

export const transferSchema = z.object({
  from: hexSchema,
  to: hexSchema,
  blockNumber: z.number(),
  transactionHash: hexSchema,
  amount: z.string(),
  token: tokenSchema,
  tokenAddress: hexSchema,
  type: z.enum(['deposit', 'transfer', 'withdrawal', 'fee', 'mint', 'refund']),
  timestamp: z.string(),
  fields: z.any(),
});

export const logsSchema = z.object({
  address: addressSchema,
  blockNumber: z.number(),
  logIndex: z.number(),
  data: hexSchema,
  timestamp: z.string(),
  topics: z.array(hexSchema),
  transactionHash: hexSchema,
  transactionIndex: z.number(),
});
