import type { FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../utils/http-error.js';

export function getUserOrThrow(req: FastifyRequest) {
  const user = req.user;
  if (!user) {
    throw new UnauthorizedError('User not authenticated');
  }
  return user;
}

export function getUser(req: FastifyRequest) {
  return req.user;
}
