import closeWithGrace from 'close-with-grace';

import { buildApp } from './build-app';
import { env } from './env';
import { db } from '@/db';

const app = buildApp(
    true,
    db
);

closeWithGrace(async ({ signal, err }) => {
    if (err) {
        app.log.error({ err }, 'server closing with error');
    } else {
        app.log.info(`${signal} received, server closing`);
    }
    await app.close();
});

await app.listen({ port: env.PORT });
