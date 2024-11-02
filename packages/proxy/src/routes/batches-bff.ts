import type { FastifyApp } from '../app.js';
import { buildUrl } from '../utils/url.js';
import { z } from 'zod';
import { pipeGetRequest } from '../services/block-explorer.js';

const batchesIndexSchema = {
  schema: {
    querystring: z.object({
      fromDate: z.optional(z.string()),
      toDate: z.optional(z.string()),
      page: z.optional(z.coerce.number()),
      limit: z.optional(z.coerce.number()),
    }),
  },
};

const batchesDetailSchema = {
  schema: {
    params: z.object({
      batchNumber: z.coerce.number(),
    }),
  },
};

export function batchRoutes(app: FastifyApp) {
  app.get('/', batchesIndexSchema, async (req, reply) => {
    const targetUrl = `${app.conf.proxyTarget}${req.url}`;
    return pipeGetRequest(targetUrl, reply);
  });

  app.get('/:batchNumber', batchesDetailSchema, async (req, reply) => {
    const targetUrl = `${app.conf.proxyTarget}${req.url}`;
    return pipeGetRequest(targetUrl, reply);
  });
}
