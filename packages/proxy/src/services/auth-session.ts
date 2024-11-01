import type { FastifyRequest } from 'fastify';
import type { SiweResponse } from 'siwe';

export const AUTH_COOKIE_NAME = '_auth';

declare module '@fastify/secure-session' {
  type SessionData = AuthSession;
}

interface AuthSession {
  nonce?: string;
  siwe?: SiweResponse;
}

export function saveAuthSession(
  req: FastifyRequest,
  data: Partial<AuthSession>,
) {
  if (data.siwe) {
    req.session.siwe = data.siwe;
  }
  if (data.nonce) {
    req.session.nonce = data.nonce;
  }
}

export function readAuthSession(req: FastifyRequest) {
  return req.session;
}

export function deleteAuthSession(req: FastifyRequest) {
  req.session.delete();
}
