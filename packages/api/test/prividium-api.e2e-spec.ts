/**
 * Prividium API End-to-End Tests
 *
 * These tests verify the Prividium mode functionality for the Block Explorer API,
 * including authentication flows, privacy-filtered endpoints, and access control.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";
import { setupPrividiumTestEnvironment } from "./prividium.env";
import {
  createTestSiweMessage,
  createMockSession,
  createAuthHeaders,
  TEST_WALLET_DATA,
  TEST_ADDRESSES,
} from "./prividium/auth-utils";

describe("Prividium API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Ensure Prividium environment is configured
    setupPrividiumTestEnvironment();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.build({ prividium: true })],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure app with Prividium mode
    configureApp(app);
    app.enableShutdownHooks();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
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
        .expect(200);

      expect(response.text).toContain("Sign in with Ethereum");
      expect(response.text).toContain(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
    });

    it("should verify valid SIWE signature", async () => {
      // First get the message
      const messageResponse = await request(app.getHttpServer())
        .post("/auth/message")
        .send({ address: TEST_WALLET_DATA.AUTHENTICATED_USER.address });

      // Create and sign the SIWE message
      const siweData = await createTestSiweMessage(TEST_WALLET_DATA.AUTHENTICATED_USER.privateKey);

      // Verify the signature
      const verifyResponse = await request(app.getHttpServer())
        .post("/auth/verify")
        .send({ signature: siweData.signature })
        .expect(200);

      expect(verifyResponse.body).toBe(true);
    });

    it("should return user info when authenticated", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      const response = await request(app.getHttpServer()).get("/auth/me").set(headers).expect(200);

      expect(response.body.address).toBe(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
    });

    it("should logout and clear session", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      await request(app.getHttpServer()).post("/auth/logout").set(headers).expect(200);
    });
  });

  describe("Basic API Endpoints", () => {
    it("should return stats without authentication", async () => {
      const response = await request(app.getHttpServer()).get("/stats").expect(200);

      expect(response.body).toHaveProperty("lastSealedBatch");
      expect(response.body).toHaveProperty("lastVerifiedBatch");
    });

    it("should return blocks list without authentication", async () => {
      const response = await request(app.getHttpServer()).get("/blocks").expect(200);

      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("meta");
    });

    it("should return batches list without authentication", async () => {
      const response = await request(app.getHttpServer()).get("/batches").expect(200);

      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("meta");
    });
  });

  describe("Address Information Access", () => {
    it("should allow access to own address data when authenticated", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      const response = await request(app.getHttpServer())
        .get(`/address/${TEST_WALLET_DATA.AUTHENTICATED_USER.address}`)
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty("address");
      expect(response.body.address.toLowerCase()).toBe(TEST_WALLET_DATA.AUTHENTICATED_USER.address.toLowerCase());
    });

    it("should restrict access to other addresses when authenticated", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      // Try to access a different address
      await request(app.getHttpServer())
        .get(`/address/${TEST_WALLET_DATA.UNAUTHORIZED_USER.address}`)
        .set(headers)
        .expect(403); // Should be forbidden
    });

    it("should deny access to address data when not authenticated", async () => {
      // Try to access address without authentication
      await request(app.getHttpServer()).get(`/address/${TEST_WALLET_DATA.AUTHENTICATED_USER.address}`).expect(401); // Should be unauthorized
    });
  });

  describe("Transaction Access Control", () => {
    it("should allow access to own transactions when authenticated", async () => {
      const session = createMockSession(TEST_WALLET_DATA.AUTHENTICATED_USER.address);
      const headers = createAuthHeaders(session);

      const response = await request(app.getHttpServer())
        .get("/transactions")
        .query({ address: TEST_WALLET_DATA.AUTHENTICATED_USER.address })
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty("items");
    });

    it("should deny access to transactions without authentication", async () => {
      await request(app.getHttpServer())
        .get("/transactions")
        .query({ address: TEST_WALLET_DATA.AUTHENTICATED_USER.address })
        .expect(401); // Should be unauthorized
    });
  });
});
