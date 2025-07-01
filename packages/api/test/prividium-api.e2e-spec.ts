/**
 * Prividium API End-to-End Tests
 *
 * These tests verify the Prividium mode functionality for the Block Explorer API,
 * including authentication flows, privacy-filtered endpoints, and access control.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { AddressTransaction } from "../src/transaction/entities/addressTransaction.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { BatchDetails } from "../src/batch/batchDetails.entity";
import { SiweMessage } from "siwe";
import { Wallet } from "zksync-ethers";
import { applyPrividiumExpressConfig } from "../src/prividium";
import { ConfigService } from "@nestjs/config";

describe("Prividium API (e2e)", () => {
  let app: INestApplication;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transactionRepository: Repository<Transaction>;
  let blockRepository: Repository<BlockDetails>;
  let batchRepository: Repository<BatchDetails>;
  let agent: request.SuperAgentTest;

  const authorizedWallet = Wallet.createRandom();

  beforeAll(async () => {
    // Set required environment variables for Prividium config validation
    process.env.PRIVIDIUM_PRIVATE_RPC_URL = "http://localhost:4000";
    process.env.PRIVIDIUM_PRIVATE_RPC_SECRET = "test-secret";
    process.env.PRIVIDIUM_SESSION_MAX_AGE = "86400000";
    process.env.PRIVIDIUM_SESSION_SAME_SITE = "strict";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build({ prividium: true })],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    const configService = moduleFixture.get(ConfigService);
    applyPrividiumExpressConfig(app, {
      sessionSecret: configService.get<string>("prividium.privateRpcSecret") || "test-secret",
      appUrl: configService.get<string>("appUrl") || "http://localhost:3010",
      sessionMaxAge: configService.get<number>("prividium.sessionMaxAge") || 86400000,
      sessionSameSite: configService.get<"none" | "strict" | "lax">("prividium.sessionSameSite") || "strict",
    });
    app.enableShutdownHooks();

    await app.init();

    addressTransactionRepository = app.get<Repository<AddressTransaction>>(getRepositoryToken(AddressTransaction));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    batchRepository = app.get<Repository<BatchDetails>>(getRepositoryToken(BatchDetails));

    // Set up minimal test data
    if (batchRepository) {
      await batchRepository.insert({
        number: 0,
        timestamp: new Date("2022-11-10T14:44:08.000Z"),
        l1TxCount: 10,
        l2TxCount: 20,
        l1GasPrice: "10000000",
        l2FairGasPrice: "20000000",
        commitTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e21",
        proveTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e22",
        executeTxHash: "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e23",
      });
    }

    if (blockRepository) {
      await blockRepository.insert({
        number: 1,
        hash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
        timestamp: new Date("2022-11-10T14:44:08.000Z"),
        gasLimit: "0",
        gasUsed: "0",
        baseFeePerGas: "100000000",
        extraData: "0x",
        l1TxCount: 1,
        l2TxCount: 1,
        l1BatchNumber: 0,
        miner: "0x0000000000000000000000000000000000000000",
      });
    }
  });

  beforeEach(() => {
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    // Clean up test data with proper error handling
    try {
      if (addressTransactionRepository) {
        await addressTransactionRepository.delete({});
      }
      if (transactionRepository) {
        await transactionRepository.delete({});
      }
      if (blockRepository) {
        await blockRepository.delete({});
      }
      if (batchRepository) {
        await batchRepository.delete({});
      }
    } catch (error) {
      console.warn("Error cleaning up test data:", error);
    }

    if (app) {
      await app.close();
    }
  });

  describe("Authentication Flow", () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, "fetch");
    });

    afterEach(() => {
      if (fetchSpy && fetchSpy.mockRestore) {
        fetchSpy.mockRestore();
      }
    });

    it("should complete auth process for a whitelisted user", async () => {
      // Mock the whitelist check to succeed
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ authorized: true }),
      } as Response);

      // Verify user successfully logins
      const response = await agent.post("/auth/message").send({ address: authorizedWallet.address }).expect(201);
      const message = new SiweMessage(response.text);
      expect(message.address).toBe(authorizedWallet.address);
      const signature = await authorizedWallet.signMessage(message.prepareMessage());

      await agent.post("/auth/verify").send({ signature }).expect(201, "true");
      await agent.get("/auth/me").expect(200, {
        address: authorizedWallet.address,
      });

      // Logout user
      await agent.post("/auth/logout").expect(201);
      await agent.get("/auth/me").expect(401);
    });

    it("should reject a non-whitelisted user", async () => {
      const unauthorizedWallet = Wallet.createRandom();
      // Mock the whitelist check to fail
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const response = await agent.post("/auth/message").send({ address: unauthorizedWallet.address }).expect(201);
      const message = new SiweMessage(response.text);
      const signature = await unauthorizedWallet.signMessage(message.prepareMessage());

      await agent.post("/auth/verify").send({ signature }).expect(403);
    });
  });
});
