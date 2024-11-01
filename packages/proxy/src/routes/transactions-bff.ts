import type { FastifyApp } from '../app.js';
import { buildUrl } from '../utils/url.js';
import { pipeGetRequest } from '../services/block-explorer.js';
import { z } from 'zod';
import { hexSchema } from '../utils/schemas.js';

const transactionIndexSchema = {
  schema: {
    querystring: z.object({
      l1BatchNumber: z.optional(z.coerce.number()),
      blockNumber: z.optional(z.coerce.number()),
      address: z.optional(z.string()),
      fromDate: z.optional(z.string()),
      toDate: z.optional(z.string()),
      page: z.optional(z.coerce.number()),
      limit: z.optional(z.coerce.number()),
    }),
  },
};

const transactionDetailsSchema = {
  schema: {
    params: z.object({
      transactionHash: hexSchema,
    }),
  },
};

const transactionTransfersSchema = {
  schema: {
    params: z.object({
      transactionHash: hexSchema,
    }),
    querystring: z.object({
      page: z.optional(z.coerce.number()),
      limit: z.optional(z.coerce.number()),
    }),
  },
};

const transactionLogsSchema = transactionTransfersSchema;

export function transationsRoutes(app: FastifyApp) {
  app.get('/', transactionIndexSchema, async (req, reply) => {
    const targetUrl = `${app.conf.proxyTarget}${req.url}`;
    return pipeGetRequest(targetUrl, reply);
  });

  app.get('/:transactionHash', transactionDetailsSchema, async (req, reply) => {
    const targetUrl = `${app.conf.proxyTarget}${req.url}`;
    return pipeGetRequest(targetUrl, reply);
  });

  app.get(
    '/:transactionHash/transfers',
    transactionTransfersSchema,
    async (req, reply) => {
      const targetUrl = `${app.conf.proxyTarget}${req.url}`;
      return pipeGetRequest(targetUrl, reply);
    },
  );

  app.get(
    '/:transactionHash/logs',
    transactionLogsSchema,
    async (req, reply) => {
      const targetUrl = `${app.conf.proxyTarget}${req.url}`;
      return pipeGetRequest(targetUrl, reply);
    },
  );
}
