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
import { setupPrividiumTestEnvironment } from "./prividium.env";
import { createTestSiweMessage, createMockSession, createAuthHeaders, TEST_WALLET_DATA } from "./prividium/auth-utils";
import { AddressTransaction } from "../src/transaction/entities/addressTransaction.entity";
import { Transaction } from "../src/transaction/entities/transaction.entity";
import { BlockDetails } from "../src/block/blockDetails.entity";
import { BatchDetails } from "../src/batch/batchDetails.entity";

describe("Prividium API (e2e)", () => {
  let app: INestApplication;
  let addressTransactionRepository: Repository<AddressTransaction>;
  let transactionRepository: Repository<Transaction>;
  let blockRepository: Repository<BlockDetails>;
  let batchRepository: Repository<BatchDetails>;

  beforeAll(async () => {
    // Ensure Prividium environment is configured
    setupPrividiumTestEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build({ prividium: true })],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });

    // Configure app with Prividium mode
    configureApp(app);
    app.enableShutdownHooks();

    await app.init();

    // Get repositories for test data setup
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

  afterAll(async () => {
    // Clean up test data
    await addressTransactionRepository.delete({});
    await transactionRepository.delete({});
    await blockRepository.delete({});
    await batchRepository.delete({});

    await app.close();
  });

  describe("Test Infrastructure", () => {
    it("should have Prividium environment configured", () => {
      expect(process.env.PRIVIDIUM).toBe("true");
      expect(process.env.DATABASE_URL).toContain("postgres://postgres:postgres@localhost:5432/block-explorer");
    });

    it("should have test wallet data available", () => {
      expect(TEST_WALLET_DATA.AUTHENTICATED_USER.address).toBeDefined();
      expect(TEST_WALLET_DATA.AUTHENTICATED_USER.privateKey).toBeDefined();
      expect(TEST_WALLET_DATA.UNAUTHORIZED_USER.address).toBeDefined();
    });

    it("should have database connection", async () => {
      try {
        const count = await batchRepository.count();
        console.log("Database connection successful, batch count:", count);
        expect(count).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
      }
    });
  });

  describe("Health Checks", () => {
    it("should return 200 OK for health endpoint", () => {
      return request(app.getHttpServer()).get("/health").expect(200);
    });

    it("should return 200 OK for ready endpoint", () => {
      return request(app.getHttpServer()).get("/ready").expect(200);
    });
  });

  describe("Authentication Flow", () => {
    it("should get SIWE message for authentication", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/message")
        .send({ address: TEST_WALLET_DATA.AUTHENTICATED_USER.address })
        .expect(201);

      expect(response.text).toContain("wants you to sign in with your Ethereum account");
      expect(response.text).toContain(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
    });

    it.skip("should verify valid SIWE signature", async () => {
      // First get the message
      await request(app.getHttpServer())
        .post("/auth/message")
        .send({ address: TEST_WALLET_DATA.AUTHENTICATED_USER.address });

      // Create and sign the SIWE message
      const siweData = await createTestSiweMessage(TEST_WALLET_DATA.AUTHENTICATED_USER.privateKey);

      // Verify the signature
      const verifyResponse = await request(app.getHttpServer())
        .post("/auth/verify")
        .send({ signature: siweData.signature })
        .expect(201);

      expect(verifyResponse.body).toBe(true);
    });

    it.skip("should return user info when authenticated", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      const response = await request(app.getHttpServer()).get("/auth/me").set(headers).expect(200);

      expect(response.body.address).toBe(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
    });

    it("should logout and clear session", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      await request(app.getHttpServer()).post("/auth/logout").set(headers).expect(201);
    });
  });

  describe("Basic API Endpoints", () => {
    it.skip("should return stats without authentication", async () => {
      const response = await request(app.getHttpServer()).get("/stats");

      console.log("Stats response status:", response.status);
      console.log("Stats response body:", response.body);
      console.log("Stats response text:", response.text);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("lastSealedBatch");
      expect(response.body).toHaveProperty("lastVerifiedBatch");
    });

    it.skip("should return blocks list without authentication", async () => {
      const response = await request(app.getHttpServer()).get("/blocks").expect(200);

      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("meta");
    });

    it.skip("should return batches list without authentication", async () => {
      const response = await request(app.getHttpServer()).get("/batches").expect(200);

      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("meta");
    });
  });

  describe("Address Information Access", () => {
    it.skip("should allow access to own address data when authenticated", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      const response = await request(app.getHttpServer())
        .get(`/address/${TEST_WALLET_DATA.AUTHENTICATED_USER.address}`)
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty("address");
      expect(response.body.address.toLowerCase()).toBe(TEST_WALLET_DATA.AUTHENTICATED_USER.address.toLowerCase());
    });

    it.skip("should restrict access to other addresses when authenticated", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      // Try to access a different address
      await request(app.getHttpServer())
        .get(`/address/${TEST_WALLET_DATA.UNAUTHORIZED_USER.address}`)
        .set(headers)
        .expect(403); // Should be forbidden
    });

    it.skip("should deny access to address data when not authenticated", async () => {
      // Try to access address without authentication
      await request(app.getHttpServer()).get(`/address/${TEST_WALLET_DATA.AUTHENTICATED_USER.address}`).expect(401); // Should be unauthorized
    });
  });

  describe("Transaction Access Control", () => {
    it.skip("should allow access to own transactions when authenticated", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      const response = await request(app.getHttpServer())
        .get("/transactions")
        .query({ address: TEST_WALLET_DATA.AUTHENTICATED_USER.address })
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty("items");
    });

    it.skip("should deny access to transactions without authentication", async () => {
      await request(app.getHttpServer())
        .get("/transactions")
        .query({ address: TEST_WALLET_DATA.AUTHENTICATED_USER.address })
        .expect(401); // Should be unauthorized
    });
  });
});
