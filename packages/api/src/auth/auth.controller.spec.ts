import { AuthController } from "./auth.controller";
import { mock } from "jest-mock-extended";
import { Request } from "express";
import { VerifySignatureDto } from "./auth.dto";
import { BadRequestException, HttpException, UnprocessableEntityException } from "@nestjs/common";
import { privateKeyToAccount } from "viem/accounts";
import { bytesToHex, Hex } from "viem";
import { SiweMessage } from "siwe";

type CalculatedSiwe = {
  msg: string;
  signature: Hex;
  siwe: SiweMessage;
  address: Hex;
};

async function calculateSiwe(nonce: string, privateKey: Hex, expiresAt: null | Date = null): Promise<CalculatedSiwe> {
  // Create account from private key
  const account = privateKeyToAccount(privateKey as Hex);

  // Create SIWE message
  const message = new SiweMessage({
    domain: "localhost",
    address: account.address,
    statement: "Sign in with Ethereum",
    uri: "http://localhost:3000",
    version: "1",
    chainId: 1,
    nonce,
  });

  if (expiresAt !== null) {
    message.expirationTime = expiresAt.toISOString();
  }

  // Create message string and sign it
  const messageString = message.prepareMessage();
  const signature = await account.signMessage({ message: messageString });
  return {
    msg: messageString,
    signature,
    siwe: message,
    address: account.address,
  };
}

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
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      req.session = {
        nonce: nonce,
      };

      const { msg, signature } = await calculateSiwe(nonce, privateKey);

      body.message = msg;
      body.signature = signature;

      const res = await controller.verifySignature(body, req);
      expect(res).toBe(true);
      expect(req.session.siwe).not.toBe(undefined);
    });

    it("throws error and set session to null when a nonce does not match", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      req.session = {
        nonce: nonce,
      };

      const { msg, signature } = await calculateSiwe(nonce, privateKey);

      body.message = msg.replace(nonce, "falsenonce");
      body.signature = signature;

      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(BadRequestException);
      expect(req.session).toBe(null);
    });

    it("throws error and set session to null when a signature cannot be verified", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      req.session = {
        nonce: nonce,
      };

      const { msg } = await calculateSiwe(nonce, privateKey);

      body.message = msg;
      body.signature = bytesToHex(Buffer.alloc(64).fill(0));

      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(UnprocessableEntityException);
      expect(req.session).toBe(null);
    });

    it("throws error and set session to null when message is expired", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      req.session = {
        nonce: nonce,
      };

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() - 1); // One year ago;
      const { msg, signature } = await calculateSiwe(nonce, privateKey, expiresAt);

      body.message = msg;
      body.signature = signature;

      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(HttpException);
      expect(req.session).toBe(null);
    });
  });

  describe("logout", () => {
    it("sets session to null", () => {
      const nonce = "8r2cXq20yD3l5bomR";
      req.session = {
        nonce: nonce,
      };
      controller.logout(req);
      expect(req.session).toEqual(null);
    });
  });

  describe("me", () => {
    it("returns address stored in session", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const { siwe, address } = await calculateSiwe(nonce, privateKey);
      req.session.siwe = siwe;
      const res = await controller.me(req);
      expect(res).toEqual({ address });
    });
  });
});
