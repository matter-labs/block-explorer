import type { FastifyApp } from '../app.js';
import { generateNonce, SiweMessage } from 'siwe';
import {
  deleteAuthSession,
  readAuthSession,
  saveAuthSession,
} from '../services/auth-session.js';
import { getUserOrThrow } from '../services/user.js';
import { env } from '../env.js';

export default function authRoutes(app: FastifyApp) {
  app.get('/nonce', async (req, reply) => {
    const nonce = generateNonce();
    saveAuthSession(req, { nonce });
    reply.type('text/plain');
    return nonce;
  });

  app.post('/verify', async (req, reply) => {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: validation is performed by siwe
      const { message, signature } = req.body as any;

      const siweMessage = new SiweMessage(message);
      const siwe = await siweMessage.verify({ signature });
      const session = readAuthSession(req);

      if (siwe.data.nonce !== session.nonce) {
        app.log.warn('Invalid nonce.');
        return reply.status(422).send({ message: 'Invalid nonce.' });
      }

      saveAuthSession(req, { siwe });
      return reply.send({ ok: true });
    } catch (err) {
      app.log.warn(err, 'Failed to verify signed message.');
      return reply
        .status(400)
        .send({ message: 'Failed to verify signed message.' });
    }
  });

  app.get('/logout', async (req, reply) => {
    deleteAuthSession(req);
    return reply.status(204).send();
  });

  app.get('/token', async (req, reply) => {
    const user = getUserOrThrow(req);
    const response = await fetch(`${env.USER_TOKEN_URL}`, {
      method: 'POST',
      body: JSON.stringify({
        address: user,
        secret: app.conf.createTokenSecret,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    return reply.send(response.body);
  });

  // FIXME: This is a temporary route to get the user address.
  app.get('/user', async (req, reply) => {
    const user = getUserOrThrow(req);
    return reply.send({ address: user });
  });
}
