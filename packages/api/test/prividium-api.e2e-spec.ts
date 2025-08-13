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
import { applyPrividiumExpressConfig } from "../src/prividium";
import { ConfigService } from "@nestjs/config";

describe("Prividium API (e2e)", () => {
  let app: INestApplication;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transactionRepository: Repository<Transaction>;
  let blockRepository: Repository<BlockDetails>;
  let batchRepository: Repository<BatchDetails>;
  let agent: request.SuperAgentTest;

  const mockWalletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const mockToken = "mock-jwt-token";

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build({ prividium: true })],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    const configService = moduleFixture.get(ConfigService);
    applyPrividiumExpressConfig(app, {
      sessionSecret: configService.get<string>("prividium.sessionSecret"),
      appUrl: configService.get<string>("appUrl"),
      sessionMaxAge: configService.get<number>("prividium.sessionMaxAge"),
      sessionSameSite: configService.get<"none" | "strict" | "lax">("prividium.sessionSameSite"),
    });
    app.enableShutdownHooks();

    await app.init();

    addressTransactionRepository = app.get<Repository<AddressTransaction>>(getRepositoryToken(AddressTransaction));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    batchRepository = app.get<Repository<BatchDetails>>(getRepositoryToken(BatchDetails));

    // Set up minimal test data
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
  });

  beforeEach(() => {
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    // Clean up test data
    await addressTransactionRepository.delete({});
    await transactionRepository.delete({});
    await blockRepository.delete({});
    await batchRepository.delete({});

    await app.close();
  });

  describe("Authentication Flow", () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, "fetch");
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it("should complete auth process with valid token", async () => {
      // Mock successful permissions API response
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          wallets: [mockWalletAddress],
        }),
      });

      // Login with token
      const loginResponse = await agent.post("/auth/login").send({ token: mockToken }).expect(201);

      expect(loginResponse.body).toEqual({ address: mockWalletAddress });
      expect(fetchSpy).toHaveBeenCalledWith(expect.any(URL), {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      // Check authenticated user
      await agent.get("/auth/me").expect(200, {
        address: mockWalletAddress,
      });

      // Logout user
      await agent.post("/auth/logout").expect(201);
      await agent.get("/auth/me").expect(401);
    });

    it("should reject login with forbidden token", async () => {
      // Mock 403 response from permissions API
      fetchSpy.mockResolvedValueOnce({
        status: 403,
        json: jest.fn(),
      });

      await agent.post("/auth/login").send({ token: "invalid-token" }).expect(400);

      expect(fetchSpy).toHaveBeenCalledWith(expect.any(URL), {
        headers: { Authorization: "Bearer invalid-token" },
      });
    });

    it("should handle invalid permissions API response", async () => {
      // Mock invalid response structure
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({ invalid: "response" }),
      });

      await agent.post("/auth/login").send({ token: mockToken }).expect(500);
    });

    it("should handle permissions API network error", async () => {
      // Mock network error
      fetchSpy.mockRejectedValueOnce(new Error("Network error"));

      await agent.post("/auth/login").send({ token: mockToken }).expect(500);
    });
  });
});
