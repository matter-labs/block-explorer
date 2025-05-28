import { AuthController } from "./auth.controller";
import { mock } from "jest-mock-extended";
import { Request } from "express";
import { VerifySignatureDto } from "./auth.dto";
import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { calculateSiwe } from "../../test/utils/siwe-message-tools";
import { ConfigService } from "@nestjs/config";
import { SiweMessage } from "siwe";

describe("AuthController", () => {
  let controller: AuthController;
  let req: Request;
  let configServiceMock: ConfigService;
  const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const chainId = 300;
  const configServiceValues = {
    NODE_ENV: "production",
    appUrl: "https://blockexplorer.com",
    "prividium.chainId": chainId,
    PRIVIDIUM_CHAIN_ID: chainId,
    "prividium.privateRpcUrl": "https://rpc.com",
    PRIVIDIUM_PRIVATE_RPC_URL: "https://rpc.com",
    "prividium.privateRpcSecret": "secret",
    PRIVIDIUM_PRIVATE_RPC_SECRET: "secret",
    "prividium.appHostname": "blockexplorer.com",
    PRIVIDIUM_APP_HOSTNAME: "blockexplorer.com",
  };

  beforeEach(() => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => configServiceValues[key]),
    });
    controller = new AuthController(configServiceMock);
    req = mock<Request>();
  });

  describe("#getMessage", () => {
    it("returns a message to sign", async () => {
      const message = controller.getMessage(req, { address });
      const siweMessage = new SiweMessage(message);
      expect(siweMessage.address).toBe(address);
      expect(siweMessage.nonce).toHaveLength(17);
      expect(siweMessage.domain).toBe("blockexplorer.com");
      expect(siweMessage.scheme).toBe("https");
      expect(siweMessage.expirationTime).toBeDefined();
      expect(siweMessage.issuedAt).toBeDefined();
    });

    it("returns a new message each time", async () => {
      // Ensure that issuedAt and expirationTime are different
      const message1String = controller.getMessage(req, { address });
      await new Promise((resolve) => setTimeout(resolve, 1));
      const message2String = controller.getMessage(req, { address });
      await new Promise((resolve) => setTimeout(resolve, 1));
      const message3String = controller.getMessage(req, { address });

      const siweMessage1 = new SiweMessage(message1String);
      const siweMessage2 = new SiweMessage(message2String);
      const siweMessage3 = new SiweMessage(message3String);

      // Nonce, ExpirationTime, and IssuedAt should be unique across the three messages
      const nonces = new Set([siweMessage1.nonce, siweMessage2.nonce, siweMessage3.nonce]);
      expect(nonces.size).toBe(3);

      const expirationTimes = new Set([
        siweMessage1.expirationTime,
        siweMessage2.expirationTime,
        siweMessage3.expirationTime,
      ]);
      expect(expirationTimes.size).toBe(3);

      const issuedAtValues = new Set([siweMessage1.issuedAt, siweMessage2.issuedAt, siweMessage3.issuedAt]);
      expect(issuedAtValues.size).toBe(3);
    });

    it("returns a message with scheme http in development", async () => {
      const newConfigServiceValues = {
        ...configServiceValues,
        NODE_ENV: "development",
      };
      configServiceMock = mock<ConfigService>({
        get: jest.fn().mockImplementation((key: string) => newConfigServiceValues[key]),
      });
      const controller = new AuthController(configServiceMock);
      const message = controller.getMessage(req, { address });
      const siweMessage = new SiweMessage(message);
      expect(siweMessage.scheme).toBe("http");
    });

    it("sets the new message in the cookie", async () => {
      const message = controller.getMessage(req, { address });
      expect(req.session.siwe).toEqual(new SiweMessage(message));
    });

    it("replaces old message with a new message each time", async () => {
      const message1 = controller.getMessage(req, { address });
      const message2 = controller.getMessage(req, { address });
      expect(message1).not.toEqual(message2);
      expect(req.session.siwe).toEqual(new SiweMessage(message2));
    });

    it("clears session when message is requested", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

      const { siwe } = await calculateSiwe({
        nonce,
        privateKey,
        domain: "blockexplorer.com",
        scheme: "http",
        chainId,
      });
      req.session = { siwe, verified: true };
      const message = controller.getMessage(req, { address });
      expect(req.session.siwe).toEqual(new SiweMessage(message));
      expect(req.session.verified).toBe(undefined);
    });

    it("throws when address is invalid", async () => {
      expect(() => controller.getMessage(req, { address: "0x123" })).toThrow(BadRequestException);
    });

    it("throws when address has invalid checksum", async () => {
      expect(() => controller.getMessage(req, { address: "0xF39Fd6e51aad88F6F4ce6aB8827279cffFb92266" })).toThrow(
        BadRequestException
      );
    });
  });

  describe("verifySignature", () => {
    let body: VerifySignatureDto;
    beforeEach(() => {
      body = new VerifySignatureDto();
    });

    it("throws when there is no message", async () => {
      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(BadRequestException);
    });

    it("validates for http in development", async () => {
      const configServiceMock = mock<ConfigService>({
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case "NODE_ENV":
              return "development";
            case "prividium.appHostname":
              return "blockexplorer.com";
            case "prividium.chainId":
              return chainId;
            default:
              return undefined;
          }
        }),
      });
      const controller = new AuthController(configServiceMock);

      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

      const { signature, siwe } = await calculateSiwe({
        nonce,
        privateKey,
        domain: "blockexplorer.com",
        scheme: "http",
        chainId,
      });
      req.session.siwe = siwe;
      req.session.verified = false;
      body.signature = signature;

      const res = await controller.verifySignature(body, req);
      expect(res).toBe(true);
      expect(req.session.verified).toBe(true);
    });

    it("returns true when a correctly signed message is send", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const {
        signature,
        address,
        siwe: originalSiwe,
      } = await calculateSiwe({
        nonce,
        privateKey,
        domain: "blockexplorer.com",
        scheme: "https",
        chainId,
      });
      req.session.siwe = originalSiwe;
      req.session.verified = false;
      body.signature = signature;

      const res = await controller.verifySignature(body, req);
      expect(res).toBe(true);
      expect(req.session.siwe).not.toBe(undefined);
      expect(req.session.siwe.address).toBe(address);
      expect(req.session.siwe.uri).toBe(originalSiwe.uri);
      expect(req.session.siwe.chainId).toBe(originalSiwe.chainId);
      expect(req.session.siwe.domain).toBe(originalSiwe.domain);
      expect(req.session.siwe.scheme).toBe(originalSiwe.scheme);
      expect(req.session.siwe.expirationTime).toBe(originalSiwe.expirationTime);
      expect(req.session.siwe.issuedAt).toBe(originalSiwe.issuedAt);
      expect(req.session.siwe.nonce).toBe(originalSiwe.nonce);
      expect(req.session.verified).toBe(true);
    });

    it("throws when msg is not a correct siwe message", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const { signature, siwe } = await calculateSiwe({ nonce, privateKey, chainId });
      req.session.siwe = siwe;
      req.session.verified = false;

      body.signature = signature;

      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(BadRequestException);
      expect(req.session).toBe(null);
    });

    it("throws when msg has wrong chainId", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const { signature, siwe } = await calculateSiwe({ nonce, privateKey, chainId: chainId + 1 });
      req.session.siwe = siwe;
      req.session.verified = false;

      body.signature = signature;

      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(BadRequestException);
      expect(req.session).toBe(null);
    });

    it("throws error and set session to null when a signature cannot be verified", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

      const { signature, siwe } = await calculateSiwe({
        nonce,
        privateKey,
        domain: "blockexplorer.com",
        scheme: "https",
        chainId,
      });

      const badSig = Buffer.from(signature.replace("0x", ""), "hex");
      badSig[badSig.length - 1] = ~badSig[badSig.length - 1] & 0xff; // change 1 byte

      req.session.siwe = siwe;
      req.session.verified = false;
      body.signature = `0x${badSig.toString("hex")}`;

      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(UnprocessableEntityException);
      expect(req.session).toBe(null);
    });

    it("throws error and set session to null when message is expired", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() - 1); // One year ago;
      const { signature, siwe } = await calculateSiwe({
        scheme: "https",
        domain: "blockexplorer.com",
        nonce,
        privateKey,
        expiresAt,
        chainId,
      });
      req.session.siwe = siwe;
      req.session.verified = false;
      body.signature = signature;

      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(
        new HttpException({ message: "Expired message." }, 440)
      );
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

  describe("GET /me", () => {
    it("returns address stored in session", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const { siwe, address } = await calculateSiwe({ nonce, privateKey, chainId });
      req.session.siwe = siwe;
      const res = await controller.me(req);
      expect(res).toEqual({ address });
    });
  });

  describe("POST /token", () => {
    let originalFetch: typeof fetch;
    let mockFetch: ReturnType<typeof jest.fn>;
    let siwe: SiweMessage;

    beforeEach(async () => {
      originalFetch = global.fetch;
      const mock = jest.fn();
      mockFetch = mock;
      global.fetch = mock;
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const { siwe: siweMsg } = await calculateSiwe({ nonce, privateKey, chainId });
      siwe = siweMsg;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("fails if rpc returns with an error", async () => {
      const rpcResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            token: null,
            ok: false,
          }),
      };

      req.session.siwe = siwe;
      mockFetch.mockReturnValue(Promise.resolve(rpcResponse));

      await expect(() => controller.token(req)).rejects.toThrow(new InternalServerErrorException());
    });

    it("returns correct response if rpc returns correct value", async () => {
      const rpcResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            token: "sometoken",
            ok: true,
          }),
      };

      req.session.siwe = siwe;

      mockFetch.mockReturnValue(Promise.resolve(rpcResponse));
      const res = await controller.token(req);
      expect(res).toEqual({ ok: true, token: "sometoken" });
    });

    it("fails if fetch returns non ok response", async () => {
      const rpcResponse = {
        ok: false,
        json: () =>
          Promise.resolve({
            token: "sometoken",
            ok: true,
          }),
      };

      req.session.siwe = siwe;

      mockFetch.mockReturnValue(Promise.resolve(rpcResponse));
      await expect(() => controller.token(req)).rejects.toThrow(new HttpException("Error creating token", 424));
    });

    it("fails if fetch returns wrong response format", async () => {
      const rpcResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            token2: "sometoken",
            ok: true,
          }),
      };

      req.session.siwe = siwe;

      mockFetch.mockReturnValue(Promise.resolve(rpcResponse));
      await expect(() => controller.token(req)).rejects.toThrow(new InternalServerErrorException());
    });
  });
});
