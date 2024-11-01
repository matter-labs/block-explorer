import type { FastifyReply } from 'fastify';

export async function pipeGetRequest(url: string, reply: FastifyReply) {
  const response = await fetch(url);
  return reply.send(response.body);
}
