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
import { applyPrividiumExpressConfig, applySwaggerAuthMiddleware } from "../src/prividium";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

describe("Prividium API (e2e)", () => {
  let app: INestApplication;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transactionRepository: Repository<Transaction>;
  let blockRepository: Repository<BlockDetails>;
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
    blockRepository = app.get<Repository<BlockDetails>>(getRepositoryToken(BlockDetails));

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
  });

  beforeEach(() => {
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    // Clean up test data
    await addressTransactionRepository.createQueryBuilder().delete().execute();
    await transactionRepository.createQueryBuilder().delete().execute();
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
});
