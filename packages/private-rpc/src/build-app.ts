import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { DB } from '@/db';
import { usersRoutes } from '@/routes/users-routes';
import { rpcRoutes } from '@/routes/rpc-routes';

export function buildApp(produceLogs = true, db: DB) {
  const app = Fastify({
    logger: produceLogs,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.decorate('context', {
    db,
  });

  app.register(usersRoutes, { prefix: '/users' });
  app.register(rpcRoutes, { prefix: '/rpc' });

  return app;
}

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- This allow us to have conf available globally.
  interface FastifyInstance {
    context: { db: DB };
  }
}

export type WebServer = ReturnType<typeof buildApp>;
