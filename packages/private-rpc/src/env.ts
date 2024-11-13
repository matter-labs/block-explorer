import { createEnv } from '@t3-oss/env-core';
import 'dotenv/config';
import { z } from 'zod';

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string(),
    TARGET_RPC: z.string(),
    CORS_ORIGIN: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.string().array()),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
