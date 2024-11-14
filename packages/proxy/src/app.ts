import Fastify from 'fastify';
import fastifySecureSession from '@fastify/secure-session';
import { AUTH_COOKIE_NAME, readAuthSession } from './services/auth-session.js';
import type { NodeEnv } from './env.js';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Address } from 'viem';
import { allRoutes } from './routes/index.js';
import { HttpError } from './utils/http-error.js';
import type { Hex } from './utils/schemas.js';
import cors from '@fastify/cors';
import { verifyRequestOrigin } from './utils/requests.js';

const SESSION_EXPIRY = 24 * 60 * 60; // 1 day

export function buildApp(
  sessionSecret: Hex,
  nodeEnv: NodeEnv,
  proxyTarget: string,
  createTokenSecret: string,
  corsOrigin: string[],
  rpcUrl: string,
  produceLogs = true,
) {
  const app = Fastify({
    logger: produceLogs,
  }).withTypeProvider<ZodTypeProvider>();

  app.decorate('conf', {
    proxyTarget,
    rpcUrl,
    createTokenSecret,
  });

  // TODO: Fix it for production
  app.register(cors, {
    origin: corsOrigin,
    credentials: true,
  });

  app.register(fastifySecureSession, {
    sessionName: 'session',
    cookieName: AUTH_COOKIE_NAME,
    key: Buffer.from(sessionSecret, 'hex'),
    expiry: SESSION_EXPIRY,
    cookie: {
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      httpOnly: nodeEnv === 'production',
      path: '/',
    },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Protect from CSRF
  app.addHook('onRequest', (req, reply, done) => {
    if (nodeEnv !== 'production' || req.method === 'GET') {
      return done();
    }

    const originHeader = req.headers.origin ?? null;
    const hostHeader = req.headers.host ?? null;
    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader])
    ) {
      reply.code(403).send();
      return;
    }
    done();
  });

  app.decorateRequest('user', undefined);
  app.addHook('onRequest', (req, _reply, done) => {
    // Read user from session
    const user = readAuthSession(req).siwe?.data.address;
    req.user = user as Address | undefined;

    // Update cookie expiry date if less than half of the session expiry
    const expiry = req.session.get('__ts') as number | undefined;
    if (!expiry) {
      return done();
    }

    const expiryThreshold = Math.round(Date.now() / 1000 + SESSION_EXPIRY / 2);
    if (expiry < expiryThreshold) {
      const newExpiry = Math.round(Date.now() / 1000 + SESSION_EXPIRY);
      // biome-ignore lint/suspicious/noExplicitAny: __ts is not exposed
      req.session.set<any>('__ts', newExpiry);
    }
    done();
  });

  app.register(allRoutes);

  app.setNotFoundHandler(async (_, reply) => {
    reply.code(404);
    return { message: 'Not Found' };
  });

  app.setErrorHandler(async (err, request, reply) => {
    if (err instanceof HttpError) {
      return err.handle(reply);
    }

    request.log.error({ err });
    reply.code(err.statusCode ?? 500);
    return { error: err.message };
  });

  return app;
}

export type FastifyApp = ReturnType<typeof buildApp>;

declare module 'fastify' {
  interface FastifyRequest {
    user?: Address;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- This allow us to have conf available globally.
  interface FastifyInstance {
    conf: {
      proxyTarget: string;
      rpcUrl: string;
      createTokenSecret: string;
    };
  }
}
