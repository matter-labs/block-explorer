import { customType } from 'drizzle-orm/pg-core';
import type { Hex } from 'viem';
import { z } from 'zod';

export const hexSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]*$/)
  .transform((hex) => hex as Hex);

export const hexRow = customType<{
  data: Hex;
  driverData: Buffer;
}>({
  dataType() {
    return 'bytea';
  },
  toDriver(val) {
    const parsed = hexSchema.parse(val);
    const hex = parsed.slice(2);
    // Avoid sending odd lengths. When length is odd Buffer.from ignores the first digit.
    const prefix = hex.length % 2 === 0 ? '' : '0';
    return Buffer.from(`${prefix}${hex}`, 'hex');
  },
  fromDriver(val) {
    const hex = `0x${val.toString('hex')}`;
    return hexSchema.parse(hex) as Hex;
  },
});
