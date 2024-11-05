import closeWithGrace from 'close-with-grace';

import { buildApp } from './build-app.js';
import { env } from './env.js';

const app = buildApp(
    true
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
