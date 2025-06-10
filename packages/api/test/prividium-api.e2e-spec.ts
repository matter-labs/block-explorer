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
  const unauthorizedWallet = Wallet.createRandom();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build({ prividium: true })],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    configureApp(app);
    const configService = moduleFixture.get(ConfigService);
    applyPrividiumExpressConfig(app, {
      sessionSecret: configService.get<string>("prividium.privateRpcSecret"),
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
    it("should get SIWE message for authentication", async () => {
      const response = await agent.post("/auth/message").send({ address: authorizedWallet.address }).expect(201);
      const message = new SiweMessage(response.text);
      expect(message.address).toBe(authorizedWallet.address);
    });

    it("should complete auth process", async () => {
      const response = await agent.post("/auth/message").send({ address: authorizedWallet.address });
      const message = new SiweMessage(response.text);

      // Sign the SIWE message
      const signature = await authorizedWallet.signMessage(message.prepareMessage());

      // Verify the signature
      await agent.post("/auth/verify").send({ signature }).expect(201, "true");

      // Return user info
      await agent.get("/auth/me").expect(200, {
        address: authorizedWallet.address,
      });

      // Logout
      await agent.post("/auth/logout").expect(201);

      // Try to request user info without authentication
      await agent.get("/auth/me").expect(401);
    });
  });

  // describe("Basic API Endpoints", () => {
  //   it.skip("should return stats without authentication", async () => {
  //     const response = await agent.get("/stats");

  //     console.log("Stats response status:", response.status);
  //     console.log("Stats response body:", response.body);
  //     console.log("Stats response text:", response.text);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toHaveProperty("lastSealedBatch");
  //     expect(response.body).toHaveProperty("lastVerifiedBatch");
  //   });

  //   it.skip("should return blocks list without authentication", async () => {
  //     const response = await agent.get("/blocks").expect(200);

  //     expect(response.body).toHaveProperty("items");
  //     expect(response.body).toHaveProperty("meta");
  //   });

  //   it.skip("should return batches list without authentication", async () => {
  //     const response = await agent.get("/batches").expect(200);

  //     expect(response.body).toHaveProperty("items");
  //     expect(response.body).toHaveProperty("meta");
  //   });
  // });

  // describe("Address Information Access", () => {
  //   it.skip("should allow access to own address data when authenticated", async () => {
  //     const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
  //     const headers = createAuthHeaders(session);

  //     const response = await agent
  //       .get(`/address/${TEST_WALLET_DATA.AUTHENTICATED_USER.address}`)
  //       .set(headers)
  //       .expect(200);

  //     expect(response.body).toHaveProperty("address");
  //     expect(response.body.address.toLowerCase()).toBe(TEST_WALLET_DATA.AUTHENTICATED_USER.address.toLowerCase());
  //   });

  //   it.skip("should restrict access to other addresses when authenticated", async () => {
  //     const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
  //     const headers = createAuthHeaders(session);

  //     // Try to access a different address
  //     await agent.get(`/address/${TEST_WALLET_DATA.UNAUTHORIZED_USER.address}`).set(headers).expect(403); // Should be forbidden
  //   });

  //   it.skip("should deny access to address data when not authenticated", async () => {
  //     // Try to access address without authentication
  //     await agent.get(`/address/${TEST_WALLET_DATA.AUTHENTICATED_USER.address}`).expect(401); // Should be unauthorized
  //   });
  // });

  // describe("Transaction Access Control", () => {
  //   it.skip("should allow access to own transactions when authenticated", async () => {
  //     const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
  //     const headers = createAuthHeaders(session);

  //     const response = await agent
  //       .get("/transactions")
  //       .query({ address: TEST_WALLET_DATA.AUTHENTICATED_USER.address })
  //       .set(headers)
  //       .expect(200);

  //     expect(response.body).toHaveProperty("items");
  //   });

  //   it.skip("should deny access to transactions without authentication", async () => {
  //     await agent.get("/transactions").query({ address: TEST_WALLET_DATA.AUTHENTICATED_USER.address }).expect(401); // Should be unauthorized
  //   });
  // });
});
