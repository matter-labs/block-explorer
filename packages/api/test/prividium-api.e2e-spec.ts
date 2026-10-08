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
import { IndexerState } from "../src/indexerState/indexerState.entity";
import { applyPrividiumExpressConfig, applySwaggerAuthMiddleware } from "../src/prividium";
import { ExplorerSessionVerifier } from "../src/auth/explorerSession";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import express from "express";
import cookieSession from "cookie-session";

describe("Prividium API (e2e)", () => {
  let app: INestApplication;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transactionRepository: Repository<Transaction>;
  let transactionReceiptRepository: Repository<TransactionReceipt>;
  let blockRepository: Repository<BlockDetails>;
  let indexerStateRepository: Repository<IndexerState>;
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
    applySwaggerAuthMiddleware(
      app as NestExpressApplication,
      configService,
      moduleFixture.get(ExplorerSessionVerifier, { strict: false })
    );

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
    indexerStateRepository = app.get<Repository<IndexerState>>(getRepositoryToken(IndexerState));

    await indexerStateRepository.insert({ id: 1, lastReadyBlockNumber: 1 });

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
    await indexerStateRepository.createQueryBuilder().delete().execute();
    await addressTransactionRepository.createQueryBuilder().delete().execute();
    await transactionReceiptRepository.createQueryBuilder().delete().execute();
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

      expect(loginResponse.body).toEqual({
        address: mockWalletAddress,
        wallets: [mockWalletAddress],
        hasFullReadAccess: false,
        hasAdminRead: false,
      });
      expect(fetchSpy).toHaveBeenCalledWith(expect.any(URL), {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      // Check authenticated user
      await agent.get("/auth/me").expect(200, {
        address: mockWalletAddress,
        wallets: [mockWalletAddress],
        hasFullReadAccess: false,
        hasAdminRead: false,
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

    it("rejects a token issued to another application and creates no session", async () => {
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
            oauthClientId: "some-dapp",
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            roles: [{ roleName: "admin", systemPermissions: ["full_read_access", "admin_read"] }],
          }),
        });

      await agent.post("/auth/login").send({ token: "foreign-app-token" }).expect(403);

      await agent.get("/auth/me").expect(401);
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
        json: jest.fn().mockResolvedValue({
          roles: [{ roleName: "user" }],
          wallets: [{ walletAddress: mockWalletAddress }],
        }),
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
          json: jest.fn().mockResolvedValue({
            roles: [{ roleName: "admin", systemPermissions: ["full_read_access"] }],
          }),
        });

      await agent.post("/auth/login").send({ token: mockToken }).expect(201);

      // Mock the roles check for /docs access (admin)
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          roles: [{ roleName: "admin", systemPermissions: ["full_read_access"] }],
          wallets: [{ walletAddress: mockWalletAddress }],
        }),
      });

      const response = await agent.get("/docs");
      // Swagger returns 200 with HTML content
      expect(response.status).toBe(200);
      expect(response.text).toContain("swagger");
    });
  });
  // Cookies minted by a login that did not check the token's application must not outlive the fix.
  describe("Cookie sessions issued before the token's application was checked", () => {
    const otherTxHash = "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20";
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, "fetch");
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    // Signs a session cookie exactly as the explorer does, bypassing the login checks.
    const forgeSessionCookie = async (token: string) => {
      const configService = app.get(ConfigService);
      const minter = express();
      minter.use(
        cookieSession({
          name: "_auth",
          secret: configService.get<string>("prividium.sessionSecret"),
          maxAge: configService.get<number>("prividium.sessionMaxAge"),
          httpOnly: true,
          sameSite: configService.get<"none" | "strict" | "lax">("prividium.sessionSameSite"),
          path: "/",
        })
      );
      minter.get("/", (req, res) => {
        Object.assign(req.session, {
          address: mockWalletAddress,
          wallets: [mockWalletAddress],
          token,
          hasFullReadAccess: true,
          hasAdminRead: true,
          expiresAt: new Date(2100, 0, 0).toISOString(),
        });
        res.end();
      });
      const response = await request(minter).get("/");
      return (response.headers["set-cookie"] as string[]).map((cookie) => cookie.split(";")[0]).join("; ");
    };

    const mockPermissionsApi = (currentSession: Record<string, unknown>) =>
      fetchSpy.mockImplementation(async (url: URL) => ({
        status: 200,
        json: jest.fn().mockResolvedValue(
          url.pathname.endsWith("/current-session")
            ? currentSession
            : {
                roles: [{ roleName: "admin", systemPermissions: ["full_read_access", "admin_read"] }],
                wallets: [{ walletAddress: mockWalletAddress }],
              }
        ),
      }));

    it("still accepts a cookie whose token belongs to the explorer", async () => {
      mockPermissionsApi({ type: "user", expiresAt: new Date(2100, 0, 0).toISOString() });
      const cookie = await forgeSessionCookie("pre-fix-explorer-token");

      await request(app.getHttpServer()).get("/auth/me").set("Cookie", cookie).expect(200);
    });

    it("rejects a cookie whose token was issued to another application and clears it", async () => {
      mockPermissionsApi({ type: "user", expiresAt: new Date(2100, 0, 0).toISOString(), oauthClientId: "some-dapp" });
      const cookie = await forgeSessionCookie("pre-fix-foreign-token");

      const response = await request(app.getHttpServer()).get("/transactions").set("Cookie", cookie);

      expect(response.status).toBe(401);
      expect(JSON.stringify(response.body)).not.toContain(otherTxHash);
      expect((response.headers["set-cookie"] as string[]).join(";")).toContain("_auth=;");
    });

    it("rejects the same cookie on the docs", async () => {
      mockPermissionsApi({ type: "user", expiresAt: new Date(2100, 0, 0).toISOString(), oauthClientId: "some-dapp" });
      const cookie = await forgeSessionCookie("pre-fix-foreign-token");

      await request(app.getHttpServer()).get("/docs").set("Cookie", cookie).expect(401);
    });
  });

  // `/API/...` reaches the `/api/...` handler, so it must hit the same full read access gate.
  describe("Etherscan API route authorization", () => {
    const otherAddress = "0xc7e0220d02d549c4846A6EC31D89C3B670Ebe35C";
    const otherTxHash = "0x8a008b8dbbc18035e56370abb820e736b705d68d6ac12b203603db8d9ea87e20";
    let fetchSpy: jest.SpyInstance;

    beforeAll(async () => {
      await transactionRepository.insert({
        to: otherAddress,
        from: otherAddress,
        data: "0x",
        value: "0x2386f26fc10000",
        fee: "0x2386f26fc10000",
        nonce: 42,
        blockHash: "0x4f86d6647711915ac90e5ef69c29845946f0a55b3feaa0488aece4a359f79cb1",
        isL1Originated: true,
        hash: otherTxHash,
        transactionIndex: 1,
        blockNumber: 1,
        receivedAt: "2010-11-21T18:16:00.000Z",
        receiptStatus: 0,
        gasLimit: "1000000",
        gasPrice: "100",
        type: 255,
      });
      await transactionReceiptRepository.insert({
        transactionHash: otherTxHash,
        from: otherAddress,
        status: 1,
        gasUsed: "900000",
        cumulativeGasUsed: "1100000",
        contractAddress: null,
        blockNumber: 1,
      });
      await addressTransactionRepository.insert({
        number: 1,
        transactionHash: otherTxHash,
        address: otherAddress,
        blockNumber: 1,
        receivedAt: new Date("2023-01-01"),
        transactionIndex: 1,
      });
    });

    beforeEach(async () => {
      fetchSpy = jest.spyOn(global, "fetch");
      // Ordinary user: a wallet, no full read access, no admin read.
      fetchSpy
        .mockResolvedValueOnce({ status: 200, json: jest.fn().mockResolvedValue({ wallets: [mockWalletAddress] }) })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ type: "user", expiresAt: new Date(2100, 0, 0).toISOString() }),
        })
        .mockResolvedValueOnce({ status: 200, json: jest.fn().mockResolvedValue({ roles: [{ roleName: "user" }] }) });
      await agent.post("/auth/login").send({ token: mockToken }).expect(201);
      fetchSpy.mockReset();
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it.each(["/API/account/txlist", "/Api/account/txlist", "/aPi/Account/TxList"])(
      "denies %s to a session without full read access and leaks no transactions",
      async (path) => {
        const response = await agent.get(`${path}?address=${otherAddress}&page=1&offset=10`);

        expect(response.status).not.toBe(200);
        expect([401, 403, 404]).toContain(response.status);
        expect(JSON.stringify(response.body)).not.toContain(otherTxHash);
      }
    );

    it("denies the lower-case api route to a session without a bearer token", async () => {
      const response = await agent.get(`/api/account/txlist?address=${otherAddress}`);

      expect(response.status).toBe(401);
      expect(JSON.stringify(response.body)).not.toContain(otherTxHash);
    });

    it("refuses the api route when the bearer token was issued to another application", async () => {
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            roles: [{ roleName: "admin", systemPermissions: ["full_read_access"] }],
            wallets: [{ walletAddress: mockWalletAddress }],
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            type: "user",
            expiresAt: new Date(2100, 0, 0).toISOString(),
            oauthClientId: "some-dapp",
          }),
        });

      const response = await agent
        .get(`/api/account/txlist?address=${otherAddress}`)
        .set("Authorization", "Bearer some-token");

      expect(response.status).toBe(403);
      expect(JSON.stringify(response.body)).not.toContain(otherTxHash);
    });

    it("still refuses an upper-case api route when the bearer token lacks full read access", async () => {
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            roles: [{ roleName: "user", systemPermissions: [] }],
            wallets: [{ walletAddress: mockWalletAddress }],
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ type: "user", expiresAt: new Date(2100, 0, 0).toISOString() }),
        });

      const response = await agent
        .get(`/API/account/txlist?address=${otherAddress}`)
        .set("Authorization", "Bearer some-token");

      expect(response.status).toBe(403);
      expect(JSON.stringify(response.body)).not.toContain(otherTxHash);
    });
  });
});
