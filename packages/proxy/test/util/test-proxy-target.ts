import type { FastifyApp } from '../../src/app.js';
import { fastify } from 'fastify';
import { type Address, bytesToHex, type Hex, zeroAddress } from 'viem';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { hexSchema, TokenData } from '../../src/utils/schemas.js';
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

type AccountBalance = {
  balance: string;
  token: null | TokenData;
};

type AddressContent =
  | {
      type: 'account';
      address: Address;
      blockNumber: number;
      balances: Record<Hex, AccountBalance>;
      sealedNonce: number;
      verifiedNonce: number;
    }
  | {
      type: 'contract';
      address: Address;
      bytecode: Hex;
      createdInBlockNumber: number;
      creatorTxHash: Hex;
      creatorAddress: Address;
      blockNumber: number;
      balances: Record<Hex, AccountBalance>;
      totalTransactions: number;
    };

export class TestProxy {
  private port: number;
  private app: FastifyApp;
  private logs: Log[];
  private transfers: Transfer[];
  private transactions: Transaction[];
  private nextAddress: AddressContent | null;

  constructor(port = 9191) {
    this.port = port;
    this.app = fastify().withTypeProvider<ZodTypeProvider>();
    this.logs = [];
    this.transfers = [];
    this.transactions = [];
    this.nextAddress = null;
  }

  url(): string {
    return `http://localhost:${this.port}`;
  }

  addLog(srcAddr: Address, topics: Hex[], data: Hex) {
    this.logs.push({
      address: srcAddr,
      blockNumber: 100,
      logIndex: 1,
      data,
      timestamp: new Date().toISOString(),
      topics: topics,
      transactionHash: bytesToHex(randomBytes(32)),
      transactionIndex: this.logs.length,
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
    this.logs = [];
    this.transfers = [];
    this.transactions = [];
  }

  private wrapResponse<T>(collection: T[], baseUrl: string): Wrapped<T> {
    return {
      items: collection,
      meta: {
        totalItems: this.logs.length,
        itemCount: this.logs.length,
        itemsPerPage: this.logs.length,
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
    this.app.get('/address/:address', async (_req, _reply) => {
      return this.nextAddress;
    });

    this.app.get('/address/:address/logs', async (request, _reply) => {
      const { address } = z
        .object({
          address: hexSchema,
        })
        .parse(request.params);
      return this.wrapResponse(this.logs, `/address/${address}/logs`);
    });

    this.app.get('/address/:address/transfers', async (request, _reply) => {
      const { address } = z
        .object({
          address: hexSchema,
        })
        .parse(request.params);
      return this.wrapResponse(this.transfers, `/address/${address}/transfers`);
    });

    this.app.get('/transactions/:hash/transfers', async (request, _reply) => {
      const { hash } = z
        .object({
          hash: hexSchema,
        })
        .parse(request.params);
      return this.wrapResponse(
        this.transfers,
        `/transactions/${hash}/transfers`,
      );
    });

    this.app.get('/transactions/:hash/logs', async (request, _reply) => {
      const { hash } = z
        .object({
          hash: hexSchema,
        })
        .parse(request.params);
      return this.wrapResponse(this.logs, `/transactions/${hash}/logs`);
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

  setNextAddress(type: 'account' | 'contract', address: Address) {
    if (type === 'account') {
      this.nextAddress = {
        type: 'account',
        address: address,
        blockNumber: 10,
        balances: {},
        sealedNonce: 1,
        verifiedNonce: 1,
      };
    } else {
      this.nextAddress = {
        type: 'contract',
        address: address,
        bytecode: '0x01',
        createdInBlockNumber: 1,
        creatorTxHash: '0x',
        creatorAddress: zeroAddress,
        blockNumber: 1,
        balances: {},
        totalTransactions: 1,
      };
    }
  }
}

export const testResponseSchema = z.object({
  url: z.string(),
});
