import type { FastifyApp } from '../app.js';
import { pipeGetRequest } from '../services/block-explorer.js';
import { z } from 'zod';
import {
  addressSchema,
  enumeratedSchema,
  enumeratedTransferSchema,
  hexSchema,
} from '../utils/schemas.js';
import { wrapIntoPaginationInfo } from '../utils/pagination.js';
import { getUserOrThrow } from '../services/user.js';
import { buildUrl } from '../utils/url.js';

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

export type Transaction = z.infer<typeof transactionSchema>;

const paginatedTransactionsSchema = enumeratedSchema(transactionSchema);

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
    const { items } = await fetch(`${app.conf.proxyTarget}${req.url}`)
      .then((res) => res.json())
      .then((json) => paginatedTransactionsSchema.parse(json));

    const filtered = items.filter((tx) => tx.from === user || tx.to === user);
    return wrapIntoPaginationInfo(
      filtered,
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
    async (req, _reply) => {
      const user = getUserOrThrow(req);
      const limit = req.query.limit || 10;

      const baseUrl = `${app.conf.proxyTarget}/transactions/${req.params.transactionHash}/transfers`;
      const res = await fetch(buildUrl(baseUrl, req.query))
        .then((res) => res.json())
        .then((json) => enumeratedTransferSchema.parse(json));

      const filtered = res.items.filter(
        (transfer) => transfer.from === user || transfer.to === user,
      );

      return wrapIntoPaginationInfo(filtered, baseUrl, limit);
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
