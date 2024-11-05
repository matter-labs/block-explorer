import Fastify, { type FastifyReply } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { handleRpc } from 'typed-rpc/server';
import { RpcService } from './rpc-service';
import { DB } from '@/db';
import { usersRoutes } from '@/users-routes';
import { getUserByToken } from '@/query/user';
import { z } from 'zod';
import { FastifyError } from '@fastify/error';

class HttpError extends Error implements FastifyError{
  statusCode: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.statusCode = status
  }

  public handle(reply: FastifyReply) {
    return reply.code(this.statusCode).send({ error: this.message });
  }

  get code(): string {
    return this.statusCode.toString()
  }
}


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

  app.post(
    '/rpc/:token',
    { schema: { params: z.object({ token: z.string() }) } },
    async (req, reply) => {
      const user = await getUserByToken(app.context.db, req.params.token)
          .then(maybe => maybe.expect(new HttpError("Unauthorized", 401)));
      const res = await handleRpc(req.body, new RpcService(user.address));
      reply.send(res);
    },
  );

  return app;
}

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- This allow us to have conf available globally.
  interface FastifyInstance {
    context: { db: DB };
  }
}

export type WebServer = ReturnType<typeof buildApp>;
