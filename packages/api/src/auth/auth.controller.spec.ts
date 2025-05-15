import { AuthController } from "./auth.controller";
import { mock } from "jest-mock-extended";
import { Request } from "express";
import { VerifySignatureDto } from "./auth.dto";
import { BadRequestException } from "@nestjs/common";

describe("AuthController", () => {
  let controller: AuthController;
  let req: Request;

  beforeEach(() => {
    controller = new AuthController();
    req = mock<Request>();
  });

  describe("#getNonce", () => {
    it("returns a nonce", async () => {
      const nonce = await controller.getNonce(req);
      expect(nonce).toHaveLength(17);
    });

    it("returns a new nonce each time", async () => {
      const nonce1 = await controller.getNonce(req);
      const nonce2 = await controller.getNonce(req);
      const nonce3 = await controller.getNonce(req);

      expect(nonce1).not.toEqual(nonce2);
      expect(nonce1).not.toEqual(nonce3);
      expect(nonce2).not.toEqual(nonce3);
    });

    it("sets the new nonce in the cookie", async () => {
      const nonce = await controller.getNonce(req);

      expect(req.session.nonce).toEqual(nonce);
    });

    it("replaces old nonde with new nonce each time", async () => {
      const nonce1 = await controller.getNonce(req);
      const nonce2 = await controller.getNonce(req);

      expect(nonce1).not.toEqual(nonce2);
      expect(req.session.nonce).toEqual(nonce2);
    });
  });

  describe("verifySignature", () => {
    let body;
    beforeEach(() => {
      body = new VerifySignatureDto();
    });

    it("throws when there is no nonce", async () => {
      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(BadRequestException);
    });

    it("returns true when a correctly signed message is send", async () => {
      req.session = {
        nonce: "8r2cXq20yD3l5bomR",
      };
      body.message =
        "localhost wants you to sign in with your Ethereum account:\n0x36Ea1B6673eA6269014D6cA0AdCca6598f618319\n\nSign in with Ethereum\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 1\nNonce: 8r2cXq20yD3l5bomR\nIssued At: 2025-05-15T00:07:06.055Z";
      body.signature =
        "0xc8db1d7c3e28fc25444fb1365457213f5026039905d20ff45651d2227fadd87d7fc3378d7e8cd8a9e072b649844e2082bb145f38b6ff2e5e987f8c1ff9d4a7361c";

      const res = await controller.verifySignature(body, req);
      expect(res).toBe(true);
      expect(req.session.siwe).not.toBe(undefined);
    });

    it("returns false and set session to null when a signature cannot be verified", async () => {
      req.session = {
        nonce: "8r2cXq20yD3l5bomR",
      };
      body.message =
        "localhost wants you to sign in with your Ethereum account:\n0x36Ea1B6673eA6269014D6cA0AdCca6598f618319\n\nSign in with Ethereum\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 1\nNonce: 8r2cXq20yD3l5bomR\nIssued At: 2025-05-15T00:07:06.055Z";
      body.signature =
        "0xc8db1d7c3e28fc25444fb1365457213f5026039905d20ff45651d2227fadd87d7fc3378d7e8cd8a9e072b649844e2082bb145f38b6ff2e5e987f8c1ff9d4a7361b";

      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(BadRequestException);
      expect(req.session).toBe(null);
    });
  });
});
