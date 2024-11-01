import type { FastifyApp } from '../app.js';
import { pipeGetRequest } from '../services/block-explorer.js';
import { z } from 'zod';
import { hexSchema } from '../utils/schemas.js';

const tokenIndexSchema = {
  schema: {
    querystring: z.object({
      minLiquidity: z.optional(z.coerce.number()),
      page: z.optional(z.coerce.number()),
      limit: z.optional(z.coerce.number()),
    }),
  },
};

const tokenDetailsSchema = {
  schema: {
    params: z.object({
      address: hexSchema,
    }),
  },
};

const tokenTransfersSchema = {
  schema: {
    params: z.object({
      address: hexSchema,
    }),
    querystring: z.object({
      page: z.optional(z.coerce.number()),
      limit: z.optional(z.coerce.number()),
    }),
  },
};

export function tokenRoutes(app: FastifyApp) {
  app.get('/', tokenIndexSchema, async (req, reply) => {
    const targetUrl = `${app.conf.proxyTarget}${req.url}`;
    return pipeGetRequest(targetUrl, reply);
  });

  app.get('/:address', tokenDetailsSchema, async (req, reply) => {
    const targetUrl = `${app.conf.proxyTarget}${req.url}`;
    return pipeGetRequest(targetUrl, reply);
  });

  app.get('/:address/transfers', tokenTransfersSchema, async (req, reply) => {
    const targetUrl = `${app.conf.proxyTarget}${req.url}`;
    return pipeGetRequest(targetUrl, reply);
  });
}
