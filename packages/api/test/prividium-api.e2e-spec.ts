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
import { TransactionReceipt } from "../src/transaction/entities/transactionReceipt.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { applyPrividiumExpressConfig, applySwaggerAuthMiddleware } from "../src/prividium";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { Log } from "../src/log/log.entity";

describe("Prividium API (e2e)", () => {
  let app: INestApplication;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transactionRepository: Repository<Transaction>;
  let transactionReceiptRepository: Repository<TransactionReceipt>;
  let blockRepository: Repository<BlockDetails>;
  let logRepository: Repository<Log>;
  let agent: request.SuperAgentTest;

  const mockWalletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const otherAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const contractAddr = "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC";
  const topicUser = `0x${"0".repeat(24)}${mockWalletAddress.slice(2)}`;
  const topicOther = `0x${"0".repeat(24)}${otherAddr.slice(2)}`;
  const selectorFoo = "0xdeadbeef";
  const selectorBar = "0xfeedface";
  const topicExact = "0x" + "bb".repeat(32);
  const txHash = "0x" + "aa".repeat(32);
  const mockToken = "mock-jwt-token";

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build({ prividium: true })],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    const configService = moduleFixture.get(ConfigService);
    applyPrividiumExpressConfig(app as NestExpressApplication, {
      sessionSecret: configService.get<string>("prividium.sessionSecret"),
      appUrl: configService.get<string>("appUrl"),
      sessionMaxAge: configService.get<number>("prividium.sessionMaxAge"),
      sessionSameSite: configService.get<"none" | "strict" | "lax">("prividium.sessionSameSite"),
    });

    // Set up Swagger auth middleware before Swagger setup
    applySwaggerAuthMiddleware(app as NestExpressApplication, configService);

    // Set up Swagger docs
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Block explorer API")
      .setDescription("ZkSync Block Explorer API")
      .setVersion("1.0")
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);

    app.enableShutdownHooks();

    await app.init();

    addressTransactionRepository = app.get<Repository<AddressTransaction>>(getRepositoryToken(AddressTransaction));
    transactionRepository = app.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    transactionReceiptRepository = app.get<Repository<TransactionReceipt>>(getRepositoryToken(TransactionReceipt));
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));
    logRepository = app.get<Repository<Log>>(getRepositoryToken(Log));

    // Set up minimal test data
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
      miner: "0x0000000000000000000000000000000000000000",
    });

    await transactionRepository.insert({
      hash: txHash,
      nonce: 0,
      blockNumber: 1,
      blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
      transactionIndex: 0,
      from: mockWalletAddress,
      to: contractAddr,
      value: "0",
      gasPrice: "1",
      gasLimit: "21000",
      data: "0x",
      receiptStatus: 1,
      fee: "1",
      isL1Originated: false,
      type: 0,
      receivedAt: new Date("2024-01-01T00:00:00Z"),
    });

    await transactionReceiptRepository.insert({
      transactionHash: txHash,
      from: mockWalletAddress,
      to: contractAddr,
      cumulativeGasUsed: "0",
      gasUsed: "0",
      contractAddress: null,
      status: 1,
    });

    await logRepository.insert([
      // matching both visibleBy and permission rule
      {
        address: contractAddr,
        topics: [selectorFoo, topicUser],
        data: "0x",
        blockNumber: 1,
        transactionHash: txHash,
        transactionIndex: 0,
        logIndex: 0,
        timestamp: new Date("2024-01-01T00:00:00Z"),
      },
      // matches visibleBy only (topic has user), different selector
      {
        address: contractAddr,
        topics: [selectorBar, topicUser],
        data: "0x",
        blockNumber: 1,
        transactionHash: txHash,
        transactionIndex: 0,
        logIndex: 1,
        timestamp: new Date("2024-01-01T00:00:01Z"),
      },
      // matches permission rule only (topic1 equals other)
      {
        address: contractAddr,
        topics: [selectorFoo, topicOther],
        data: "0x",
        blockNumber: 1,
        transactionHash: txHash,
        transactionIndex: 0,
        logIndex: 2,
        timestamp: new Date("2024-01-01T00:00:02Z"),
      },
      // different contract, should be excluded
      {
        address: otherAddr,
        topics: [selectorFoo, topicUser],
        data: "0x",
        blockNumber: 1,
        transactionHash: txHash,
        transactionIndex: 0,
        logIndex: 3,
        timestamp: new Date("2024-01-01T00:00:03Z"),
      },
      // topic2 equalTo match
      {
        address: contractAddr,
        topics: [selectorFoo, topicUser, topicExact],
        data: "0x",
        blockNumber: 1,
        transactionHash: txHash,
        transactionIndex: 0,
        logIndex: 4,
        timestamp: new Date("2024-01-01T00:00:04Z"),
      },
      // topic2 userAddress match
      {
        address: contractAddr,
        topics: [selectorFoo, topicUser, topicUser],
        data: "0x",
        blockNumber: 1,
        transactionHash: txHash,
        transactionIndex: 0,
        logIndex: 5,
        timestamp: new Date("2024-01-01T00:00:05Z"),
      },
      // topic3 userAddress match
      {
        address: contractAddr,
        topics: [selectorFoo, topicUser, topicExact, topicUser],
        data: "0x",
        blockNumber: 1,
        transactionHash: txHash,
        transactionIndex: 0,
        logIndex: 6,
        timestamp: new Date("2024-01-01T00:00:06Z"),
      },
      // topic3 equalTo match
      {
        address: contractAddr,
        topics: [selectorFoo, topicUser, topicExact, topicOther],
        data: "0x",
        blockNumber: 1,
        transactionHash: txHash,
        transactionIndex: 0,
        logIndex: 7,
        timestamp: new Date("2024-01-01T00:00:07Z"),
      },
    ]);
  });

  beforeEach(() => {
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    // Clean up test data
    await addressTransactionRepository.createQueryBuilder().delete().execute();
    await transactionRepository.createQueryBuilder().delete().execute();
    await transactionReceiptRepository.createQueryBuilder().delete().execute();
    await logRepository.createQueryBuilder().delete().execute();
    await blockRepository.createQueryBuilder().delete().execute();

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

    it("completes auth process with valid token", async () => {
      // Mock successful prividium API response
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            wallets: [mockWalletAddress],
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            type: "user",
            expiresAt: new Date(2100, 0, 0).toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            roles: [{ roleName: "user" }],
          }),
        });

      // Login with token
      const loginResponse = await agent.post("/auth/login").send({ token: mockToken }).expect(201);

      expect(loginResponse.body).toEqual({ address: mockWalletAddress, wallets: [mockWalletAddress], roles: ["user"] });
      expect(fetchSpy).toHaveBeenCalledWith(expect.any(URL), {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      // Check authenticated user
      await agent.get("/auth/me").expect(200, {
        address: mockWalletAddress,
        wallets: [mockWalletAddress],
        roles: ["user"],
      });

      // Logout user
      await agent.post("/auth/logout").expect(201);
      await agent.get("/auth/me").expect(401);
    });

    it("rejects login with forbidden token", async () => {
      // Mock 403 response from permissions API
      fetchSpy.mockResolvedValueOnce({
        status: 403,
        json: jest.fn(),
      });

      await agent.post("/auth/login").send({ token: "invalid-token" }).expect(403);

      expect(fetchSpy).toHaveBeenCalledWith(expect.any(URL), {
        headers: { Authorization: "Bearer invalid-token" },
      });
    });

    it("handles invalid permissions API response", async () => {
      // Mock invalid response structure
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({ invalid: "response" }),
      });

      await agent.post("/auth/login").send({ token: mockToken }).expect(500);
    });

    it("handles permissions API network error", async () => {
      // Mock network error
      fetchSpy.mockRejectedValueOnce(new Error("Network error"));

      await agent.post("/auth/login").send({ token: mockToken }).expect(500);
    });

    it("rejects login when roles API returns 403", async () => {
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ wallets: [mockWalletAddress] }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            type: "user",
            expiresAt: new Date(2100, 0, 0).toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          status: 403,
          json: jest.fn(),
        });

      await agent.post("/auth/login").send({ token: mockToken }).expect(403);
    });

    it("rejects login when roles API returns invalid data", async () => {
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ wallets: [mockWalletAddress] }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            type: "user",
            expiresAt: new Date(2100, 0, 0).toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ invalid: "response" }),
        });

      await agent.post("/auth/login").send({ token: mockToken }).expect(500);
    });
  });

  describe("Swagger Docs Access Control", () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, "fetch");
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it("returns 401 for unauthenticated users accessing /docs", async () => {
      await agent.get("/docs").expect(401);
    });

    it("returns 403 for authenticated non-admin users accessing /docs", async () => {
      // Login as non-admin user
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ wallets: [mockWalletAddress] }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            type: "user",
            expiresAt: new Date(2100, 0, 0).toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ roles: [{ roleName: "user" }] }),
        });

      await agent.post("/auth/login").send({ token: mockToken }).expect(201);

      // Mock the roles check for /docs access (non-admin)
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({ roles: [{ roleName: "user" }] }),
      });

      await agent.get("/docs").expect(403);
    });

    it("allows admin users to access /docs", async () => {
      // Login as admin user
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ wallets: [mockWalletAddress] }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            type: "user",
            expiresAt: new Date(2100, 0, 0).toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ roles: [{ roleName: "admin" }] }),
        });

      await agent.post("/auth/login").send({ token: mockToken }).expect(201);

      // Mock the roles check for /docs access (admin)
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({ roles: [{ roleName: "admin" }] }),
      });

      const response = await agent.get("/docs");
      // Swagger returns 200 with HTML content
      expect(response.status).toBe(200);
      expect(response.text).toContain("swagger");
    });
  });

  describe("Transactions logs visibility", () => {
    const makeResponse = (data: any, status = 200) =>
      ({
        status,
        ok: status >= 200 && status < 300,
        json: jest.fn().mockResolvedValue(data),
      } as any);

    const setupFetch = (roles: string[], rules: any[]) =>
      jest.spyOn(global, "fetch").mockImplementation((input: any) => {
        const url = input instanceof URL ? input : new URL(input as string);
        switch (url.pathname) {
          case "/api/user-wallets":
            return Promise.resolve(makeResponse({ wallets: [mockWalletAddress] }));
          case "/api/auth/current-session":
            return Promise.resolve(
              makeResponse({ type: "user", expiresAt: new Date("2100-01-01T00:00:00.000Z").toISOString() })
            );
          case "/api/profiles/me":
            return Promise.resolve(makeResponse({ roles: roles.map((r) => ({ roleName: r })) }));
          case "/api/check/event-permission-rules":
            return Promise.resolve(makeResponse({ rules }));
          default:
            return Promise.reject(new Error(`Unhandled fetch request to ${url.pathname}`));
        }
      });

    it("filters logs using permission rules", async () => {
      const fetchSpy = setupFetch(
        ["user"],
        [
          {
            contractAddress: contractAddr,
            topic0: selectorFoo,
            topic1: { type: "equalTo", value: topicOther },
            topic2: null,
            topic3: null,
          },
        ]
      );

      try {
        await agent.post("/auth/login").send({ token: mockToken }).expect(201);

        const res = await agent.get(`/transactions/${txHash}/logs?limit=20`).expect(200);
        expect(res.body.items.map((l) => l.logIndex)).toEqual([2]);
        expect(res.body.meta.totalItems).toBe(1);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it("returns no logs when permission rules are empty", async () => {
      const fetchSpy = setupFetch(["user"], []);

      try {
        await agent.post("/auth/login").send({ token: mockToken }).expect(201);

        const res = await agent.get(`/transactions/${txHash}/logs?limit=20`).expect(200);
        expect(res.body.items).toHaveLength(0);
        expect(res.body.meta.totalItems).toBe(0);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it("returns all logs for admin", async () => {
      const fetchSpy = setupFetch(["admin"], []);

      try {
        await agent.post("/auth/login").send({ token: mockToken }).expect(201);

        const res = await agent.get(`/transactions/${txHash}/logs?limit=20`).expect(200);
        expect(res.body.items.map((l) => l.logIndex)).toEqual([7, 6, 5, 4, 3, 2, 1, 0]);
        expect(res.body.meta.totalItems).toBe(8);
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });
});
