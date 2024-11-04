import type { FastifyApp } from '../app.js';
import { z } from 'zod';
import { type Address, type Hex, isAddressEqual } from 'viem';
import { pipeGetRequest } from '../services/block-explorer.js';
import { getUserOrThrow } from '../services/user.js';
import { ForbiddenError, HttpError } from '../utils/http-error.js';
import {
  addressSchema,
  hexSchema,
  logsSchema,
  tokenSchema,
  transferSchema,
} from '../utils/schemas.js';
import { requestAndFilterCollection } from '../utils/request-and-filter-collection.js';

export const addressParamsSchema = {
  params: z.object({
    address: addressSchema,
  }),
  querystring: z.object({
    page: z.optional(z.coerce.number()),
    limit: z.optional(z.coerce.number()),
  }),
};

const transfersSchema = {
  params: z.object({
    address: addressSchema,
  }),
  querystring: z.object({
    page: z.optional(z.coerce.number()),
    limit: z.optional(z.coerce.number()),
    type: z.optional(
      z.enum(['deposit', 'transfer', 'withdrawal', 'fee', 'mint', 'refund']),
    ),
    fromDate: z.optional(z.string()),
    toDate: z.optional(z.string()),
  }),
};

const accountBalanceSchema = z.object({
  balance: z.string(),
  token: z.nullable(tokenSchema),
});

const addressResponseSchema = z.union([
  z.object({
    type: z.literal('account'),
    address: addressSchema,
    blockNumber: z.number(),
    balances: z.record(hexSchema, accountBalanceSchema),
    sealedNonce: z.number(),
    verifiedNonce: z.number(),
  }),
  z.object({
    type: z.literal('contract'),
    address: addressSchema,
    bytecode: hexSchema,
    createdInBlockNumber: z.number(),
    creatorTxHash: hexSchema,
    creatorAddress: addressSchema,
    blockNumber: z.number(),
    balances: z.record(hexSchema, accountBalanceSchema),
    totalTransactions: z.number(),
  }),
]);

export const addressRoutes = (app: FastifyApp) => {
  const proxyTarget = app.conf.proxyTarget;
  app.get('/:address', { schema: addressParamsSchema }, async (req, _reply) => {
    const data = await fetch(`${proxyTarget}/address/${req.params.address}`)
      .then((res) => res.json())
      .then((json) => addressResponseSchema.parse(json));

    if (data.type === 'contract') {
      return {
        ...data,
        balances: {},
      };
    } else if (data.type === 'account') {
      const user = getUserOrThrow(req);
      if (isAddressEqual(data.address, user)) {
        return data;
      } else {
        throw new ForbiddenError('Forbidden');
      }
    }
  });

  app.get(
    '/:address/logs',
    {
      schema: addressParamsSchema,
    },
    async (req, _reply) => {
      const user = getUserOrThrow(req);
      const limit = req.query.limit || 10;
      const baseUrl = `${proxyTarget}/address/${req.params.address}/logs`;

      return await requestAndFilterCollection(
        baseUrl,
        req.query,
        logsSchema,
        (log) => log.address === user || log.topics.includes(user),
        limit,
      );
    },
  );

  app.get(
    '/:address/transfers',
    {
      schema: transfersSchema,
    },
    async (req, _reply) => {
      const user = getUserOrThrow(req);
      const limit = req.query.limit || 10;
      const baseUrl = `${proxyTarget}/address/${req.params.address}/transfers`;

      return await requestAndFilterCollection(
        baseUrl,
        req.query,
        transferSchema,
        (transfer) => transfer.from === user || transfer.to === user,
        limit,
      );
    },
  );
};
