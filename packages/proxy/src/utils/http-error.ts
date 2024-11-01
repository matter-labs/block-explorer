import type { FastifyReply } from 'fastify';

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'KnownError';
    this.statusCode = statusCode ?? 400;
  }

  public handle(reply: FastifyReply) {
    return reply.code(this.statusCode).send({ error: this.message });
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}
