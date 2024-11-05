import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import 'dotenv/config';

export const env = createEnv({
    server: {
        PORT: z.coerce.number().default(3000),
        DATABASE_URL: z.string(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
