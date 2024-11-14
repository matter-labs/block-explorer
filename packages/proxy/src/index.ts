import closeWithGrace from 'close-with-grace';
import { env } from './env.js';
import { buildApp } from './app.js';

const app = buildApp(
  env.SESSION_SECRET,
  env.NODE_ENV,
  env.BLOCK_EXPLORER_API_URL,
  env.CREATE_TOKEN_SECRET,
  env.CORS_ORIGIN,
  env.RPC_URL,
  true,
);

closeWithGrace(async ({ signal, err }) => {
  if (err) {
    app.log.error({ err }, 'server closing with error');
  } else {
    app.log.info(`${signal} received, server closing`);
  }
  await app.close();
});

await app.listen({ host: '0.0.0.0', port: env.SERVER_PORT });
