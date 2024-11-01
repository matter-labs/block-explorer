import type { FastifyApp } from '../app.js';
import { z, type ZodTypeAny } from 'zod';
import { isAddressEqual } from 'viem';
import { pipeRequest } from '../services/block-explorer.js';
import { getUserOrThrow } from '../services/user.js';
import { ForbiddenError } from '../utils/http-error.js';
import { addressSchema, hexSchema } from '../utils/schemas.js';

export const addressParamsSchema = {
  params: z.object({
    address: addressSchema,
  }),
  querystring: z.object({
    page: z.optional(z.coerce.number()),
    limit: z.optional(z.coerce.number()),
  }),
};

type Stringy = { toString: () => string };
function buildUrl(base: string, query: Record<string, Stringy>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, value.toString());
  }

  return `${base}?${params.toString()}`;
}

export type Paginated<T> = {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
  links: {
    first: string;
    previous: string;
    next: string;
    last: string;
  };
};

function wrapIntoPaginationInfo<T>(
  collection: T[],
  linksBaseUri: string,
  limit: number,
): Paginated<T> {
  return {
    items: collection,
    meta: {
      totalItems: collection.length,
      itemCount: collection.length,
      itemsPerPage: limit,
      totalPages: collection.length === 0 ? 0 : 1,
      currentPage: 1,
    },
    links: {
      first: `${linksBaseUri}?limit=${limit}`,
      previous: '',
      next: '',
      last: `${linksBaseUri}?page=1&limit=${limit}`,
    },
  };
}

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

export const tokenSchema = z.object({
  l2Address: hexSchema,
  l1Address: hexSchema,
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  usdPrice: z.number(),
  liquidity: z.number(),
  iconURL: z.string(),
});

export const transferSchema = z.object({
  from: hexSchema,
  to: hexSchema,
  blockNumber: z.number(),
  transactionHash: hexSchema,
  amount: z.string(),
  token: tokenSchema,
  tokenAddress: hexSchema,
  type: z.enum(['deposit', 'transfer', 'withdrawal', 'fee', 'mint', 'refund']),
  timestamp: z.string(),
  fields: z.any(),
});

const enumeratedTransferSchema = enumeratedSchema(transferSchema);

function enumeratedSchema<T extends ZodTypeAny>(parser: T) {
  return z.object({
    items: z.array(parser),
    meta: z.object({
      totalItems: z.number(),
      itemCount: z.number(),
      itemsPerPage: z.number(),
      totalPages: z.number(),
      currentPage: z.number(),
    }),
    links: z.object({
      first: z.string(),
      previous: z.string(),
      next: z.string(),
      last: z.string(),
    }),
  });
}

const enumeratedLogSchema = enumeratedSchema(
  z.object({
    address: addressSchema,
    blockNumber: z.number(),
    logIndex: z.number(),
    data: hexSchema,
    timestamp: z.string(),
    topics: z.array(hexSchema),
    transactionHash: hexSchema,
    transactionIndex: z.number(),
  }),
);

export const addressRoutes = (app: FastifyApp) => {
  const proxyTarget = app.conf.proxyTarget;
  app.get('/:address', { schema: addressParamsSchema }, async (req, reply) => {
    const user = getUserOrThrow(req);
    if (!isAddressEqual(req.params.address, user)) {
      throw new ForbiddenError('Forbidden');
    }
    return pipeRequest(`${proxyTarget}/address/${user}`, reply);
  });

  app.get(
    '/:address/logs',
    {
      schema: addressParamsSchema,
    },
    async (req, _reply) => {
      const user = getUserOrThrow(req);
      const limit = req.query.limit || 10;
      const url = `${proxyTarget}/address/${req.params.address}/logs`;

      const data = await fetch(buildUrl(url, req.query))
        .then((res) => res.json())
        .then((json) => enumeratedLogSchema.parse(json));

      const filtered = data.items.filter((log) =>
        log.topics.some((topic) => topic === user),
      );

      return wrapIntoPaginationInfo(filtered, url, limit);
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
      const data = await fetch(buildUrl(baseUrl, req.query))
        .then((res) => res.json())
        .then((json) => enumeratedTransferSchema.parse(json));

      const filtered = data.items.filter(
        (transfer) => transfer.from === user || transfer.to === user,
      );

      return wrapIntoPaginationInfo(filtered, baseUrl, limit);
    },
  );
};
