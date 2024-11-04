import type { FastifyApp } from '../app.js';
import { pipeGetRequest } from '../services/block-explorer.js';
import { z } from 'zod';
import {
  addressSchema,
  enumeratedSchema,
  hexSchema,
} from '../utils/schemas.js';
import { wrapIntoPaginationInfo } from '../utils/pagination.js';

export const transactionSchema = z.object({
  hash: hexSchema,
  to: addressSchema,
  from: addressSchema,
  transactionIndex: z.number(),
  data: hexSchema,
  value: z.string(),
  fee: hexSchema,
  nonce: z.number(),
  gasPrice: z.string(),
  gasLimit: z.string(),
  gasPerPubdata: z.string(),
  maxFeePerGas: z.string(),
  maxPriorityFeePerGas: z.string(),
  blockNumber: z.number(),
  blockHash: hexSchema,
  receivedAt: z.string(),
  commitTxHash: z.nullable(hexSchema),
  proveTxHash: z.nullable(hexSchema),
  executeTxHash: z.nullable(hexSchema),
  isL1Originated: z.boolean(),
  l1BatchNumber: z.number(),
  isL1BatchSealed: z.boolean(),
  type: z.number(),
  status: z.string(),
  error: z.nullable(z.string()),
  revertReason: z.nullable(z.string()),
});

const paginatedTransactionsSchema = enumeratedSchema(transactionSchema);

export type Transaction = z.infer<typeof transactionSchema>;

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
  app.get('/', transactionIndexSchema, async (req, _reply) => {
    const user = req.user;
    const data = await fetch(`${app.conf.proxyTarget}${req.url}`)
      .then((res) => res.json())
      .then((json) => paginatedTransactionsSchema.parse(json));

    const items = data.items.filter((tx) => tx.from === user || tx.to === user);
    return wrapIntoPaginationInfo(
      items,
      `/transactions`,
      req.query.limit || 10,
    );
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
