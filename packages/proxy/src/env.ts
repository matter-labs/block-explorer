import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import 'dotenv/config';

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

export type NodeEnv = z.infer<typeof nodeEnvSchema>;

export const env = createEnv({
  server: {
    NODE_ENV: nodeEnvSchema.default('development'),
    SERVER_PORT: z.coerce.number().default(3000),
    BLOCK_EXPLORER_API_URL: z.string().url(),
    SESSION_SECRET: z.string().length(64),
    CORS_ORIGIN: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.string().array()),
    RPC_URL: z.string().url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
