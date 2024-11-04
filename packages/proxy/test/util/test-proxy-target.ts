import type { FastifyApp } from '../../src/app.js';
import { fastify } from 'fastify';
import { type Address, bytesToHex, type Hex, zeroAddress } from 'viem';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { hexSchema } from '../../src/utils/schemas.js';
import { Transaction } from '../../src/routes/transactions-bff.js';

type Log = {
  address: Address;
  topics: Hex[];
  data: Hex;
  blockNumber: number;
  transactionHash: Hex;
  transactionIndex: number;
  logIndex: number;
  timestamp: string;
};

type Transfer = {
  from: Address;
  to: Address;
  blockNumber: number;
  transactionHash: Hex;
  amount: string;
  token: {
    l2Address: string;
    l1Address: string;
    symbol: string;
    name: string;
    decimals: number;
    usdPrice: number;
    liquidity: number;
    iconURL: string;
  };
  tokenAddress: Hex;
  type: string;
  timestamp: string;
  fields: Record<string, string>;
};

type Wrapped<T> = {
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

export class TestProxy {
  private port: number;
  private app: FastifyApp;
  private addressLogs: Log[];
  private transfers: Transfer[];
  private transactions: Transaction[];

  constructor(port = 9191) {
    this.port = port;
    this.app = fastify().withTypeProvider<ZodTypeProvider>();
    this.addressLogs = [];
    this.transfers = [];
    this.transactions = [];
  }

  url(): string {
    return `http://localhost:${this.port}`;
  }

  addAddressLog(srcAddr: Address, topics: Hex[], data: Hex) {
    this.addressLogs.push({
      address: srcAddr,
      blockNumber: 100,
      logIndex: 1,
      data,
      timestamp: new Date().toISOString(),
      topics: topics,
      transactionHash: bytesToHex(randomBytes(32)),
      transactionIndex: this.addressLogs.length,
    });
  }

  addTransfer(srcAddr: Address, targetAddr: Address, amount: number): void {
    this.transfers.push({
      from: srcAddr,
      to: targetAddr,
      amount: amount.toString(),
      token: {
        l1Address: zeroAddress,
        l2Address: zeroAddress,
        decimals: 1,
        iconURL: 'http://test.test',
        liquidity: 100,
        symbol: 'TEST',
        usdPrice: 1.0,
        name: 'Testy',
      },
      blockNumber: 1,
      transactionHash: bytesToHex(Buffer.alloc(32).fill(1)),
      fields: {},
      tokenAddress: zeroAddress,
      type: 'transfer',
      timestamp: new Date().toISOString(),
    });
  }

  reset() {
    this.addressLogs = [];
    this.transfers = [];
    this.transactions = [];
  }

  private wrapResponse<T>(collection: T[], baseUrl: string): Wrapped<T> {
    return {
      items: collection,
      meta: {
        totalItems: this.addressLogs.length,
        itemCount: this.addressLogs.length,
        itemsPerPage: this.addressLogs.length,
        totalPages: 1,
        currentPage: 1,
      },
      links: {
        first: `${baseUrl}?limit=10`,
        previous: '',
        next: `${baseUrl}?page=2&limit=10`,
        last: `${baseUrl}?page=1000&limit=10`,
      },
    };
  }

  async start(): Promise<void> {
    this.app.get('/address/:address/logs', async (request, _reply) => {
      const { address } = z
        .object({
          address: hexSchema,
        })
        .parse(request.params);
      return this.wrapResponse(this.addressLogs, `/address/${address}/logs`);
    });

    this.app.get('/address/:address/transfers', async (request, _reply) => {
      const { address } = z
        .object({
          address: hexSchema,
        })
        .parse(request.params);
      return this.wrapResponse(this.transfers, `/address/${address}/transfers`);
    });

    this.app.get('/transactions', async (_req, _reply) => {
      return this.wrapResponse(this.transactions, `/transactions`);
    });

    this.app.get('*', async (req) => {
      return {
        url: req.url,
      };
    });

    this.app.post('*', async (req) => {
      return {
        url: req.url,
      };
    });

    await this.app.listen({ port: 9191 });
  }

  async stop(): Promise<void> {
    await this.app.close();
  }

  addTransaction(from: Address, to: Address, hash: Hex) {
    this.transactions.push({
      hash: hash,
      to: to,
      from: from,
      data: '0x',
      value: '368708219802970062',
      isL1Originated: false,
      fee: '0x3bd1846dec0',
      nonce: 1676855,
      gasLimit: '176029',
      gasPrice: '45250000',
      gasPerPubdata: '50000',
      maxFeePerGas: '10000000000',
      maxPriorityFeePerGas: '1200000000',
      blockNumber: 48125137,
      l1BatchNumber: 493709,
      blockHash:
        '0x6276ba11be92b74687ca4f0ff54f80188d41b7e552d1d0fa39fd20fd28147c39',
      type: 2,
      transactionIndex: 1,
      receivedAt: '2024-11-04T10:54:17.916Z',
      error: null,
      revertReason: null,
      status: 'included',
      commitTxHash: null,
      executeTxHash: null,
      proveTxHash: null,
      isL1BatchSealed: false,
    });
  }
}

export const testResponseSchema = z.object({
  url: z.string(),
});
