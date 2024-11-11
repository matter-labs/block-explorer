import type { FastifyApp } from '../app.js';
import { z } from 'zod';
import { isAddressEqual } from 'viem';
import { getUserOrThrow } from '../services/user.js';
import { ForbiddenError } from '../utils/http-error.js';
import {
  addressSchema,
  hexSchema,
  logsSchema,
  tokenSchema,
  transferSchema,
} from '../utils/schemas.js';
import { requestAndFilterCollection } from '../utils/request-and-filter-collection.js';
import { getContractOwner } from '../services/rpc.js';

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
    const user = getUserOrThrow(req);
    const data = await fetch(`${proxyTarget}/address/${req.params.address}`)
      .then((res) => res.json())
      .then((json) => addressResponseSchema.parse(json));

    if (data.type === 'contract') {
      // At the moment, we verify if balances can be shown whether
      // the logged in user is the `Owner` of the contract or not.
      // This is a very naive approach and we should find a better way to do this.
      const owner = await getContractOwner(app.conf.rpcUrl, data.address);
      if (owner && isAddressEqual(owner, user)) {
        return { ...data, authorized: true };
      }

      return {
        ...data,
        authorized: false,
        balances: {},
      };
    } else if (data.type === 'account') {
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
