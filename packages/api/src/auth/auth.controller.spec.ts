import { AuthController } from "./auth.controller";
import { mock } from "jest-mock-extended";
import { Request } from "express";
import { VerifySignatureDto } from "./auth.dto";
import { BadRequestException, HttpException, UnprocessableEntityException } from "@nestjs/common";
import { Wallet } from "zksync-ethers";
import { SiweMessage } from "siwe";
import { ConfigService } from "@nestjs/config";
import { SiweMessage } from "siwe";

type CalculatedSiwe = {
  msg: string;
  signature: string;
  siwe: SiweMessage;
  address: string;
};

async function calculateSiwe({
  nonce,
  privateKey,
  expiresAt = null,
  scheme = "http",
  domain = "localhost",
}: {
  nonce: string;
  privateKey: string;
  expiresAt?: null | Date;
  scheme?: "http" | "https";
  domain?: string;
}): Promise<CalculatedSiwe> {
  // Create account from private key
  const account = new Wallet(privateKey);

  // Create SIWE message
  const message = new SiweMessage({
    domain,
    address: account.address,
    statement: "Sign in with Ethereum",
    uri: `${scheme}://${domain}`,
    version: "1",
    chainId: 1,
    nonce,
    scheme,
  });

  if (expiresAt !== null) {
    message.expirationTime = expiresAt.toISOString();
  }

  // Create message string and sign it
  const messageString = message.prepareMessage();
  const signature = await account.signMessage(messageString);
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
  let configServiceMock: ConfigService;

  beforeEach(() => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case "NODE_ENV":
            return "production";
          case "appHostname":
            return "blockexplorer.com";
          default:
            return undefined;
        }
      }),
    });
    controller = new AuthController(configServiceMock);
    req = mock<Request>();
  });

  describe("#getNonce", () => {
    it("returns a nonce", async () => {
      const nonce = await controller.getNonce(req);
      expect(nonce).toHaveLength(17);
    });

    it("returns a new nonce each time", async () => {
      const nonce1 = controller.getNonce(req);
      const nonce2 = controller.getNonce(req);
      const nonce3 = controller.getNonce(req);

      expect(nonce1).not.toEqual(nonce2);
      expect(nonce1).not.toEqual(nonce3);
      expect(nonce2).not.toEqual(nonce3);
    });

    it("sets the new nonce in the cookie", async () => {
      const nonce = controller.getNonce(req);

      expect(req.session.nonce).toEqual(nonce);
    });

    it("replaces old nonde with new nonce each time", async () => {
      const nonce1 = controller.getNonce(req);
      const nonce2 = controller.getNonce(req);

      expect(nonce1).not.toEqual(nonce2);
      expect(req.session.nonce).toEqual(nonce2);
    });
  });

  describe("verifySignature", () => {
    let body: VerifySignatureDto;
    beforeEach(() => {
      body = new VerifySignatureDto();
    });

    it("throws when there is no nonce", async () => {
      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(BadRequestException);
    });

    it("validates for http in development", async () => {
      const configServiceMock = mock<ConfigService>({
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case "NODE_ENV":
              return "development";
            case "appHostname":
              return "blockexplorer.com";
            default:
              return undefined;
          }
        }),
      });
      const controller = new AuthController(configServiceMock);

      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      req.session = {
        nonce: nonce,
      };

      const { msg, signature } = await calculateSiwe({
        nonce,
        privateKey,
        domain: "blockexplorer.com",
        scheme: "http",
      });

      body.message = msg;
      body.signature = signature;

      const res = await controller.verifySignature(body, req);
      expect(res).toBe(true);
    });

    it("returns true when a correctly signed message is send", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      req.session = {
        nonce: nonce,
      };

      const {
        msg,
        signature,
        address,
        siwe: originalSiwe,
      } = await calculateSiwe({
        nonce,
        privateKey,
        domain: "blockexplorer.com",
        scheme: "https",
      });

      body.message = msg;
      body.signature = signature;

      const res = await controller.verifySignature(body, req);
      expect(res).toBe(true);
      expect(req.session.siwe).not.toBe(undefined);
      expect(req.session.siwe.address).toBe(address);
      expect(req.session.siwe.uri).toBe(originalSiwe.uri);
      expect(req.session.siwe.chainId).toBe(originalSiwe.chainId);
      expect(req.session.siwe.domain).toBe(originalSiwe.domain);
      expect(req.session.siwe.scheme).toBe(originalSiwe.scheme);
    });

    it("throws error and set session to null when a nonce does not match", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      req.session = {
        nonce: nonce,
      };

      const { msg, signature } = await calculateSiwe({ nonce, privateKey });

      body.message = msg.replace(nonce, "falsenonce");
      body.signature = signature;

      await expect(() => controller.verifySignature(body, req)).rejects.toThrow(BadRequestException);
      expect(req.session).toBe(null);
    });

    it("throws when msg is not a correct siwe message", async () => {
      const nonce = "8r2cXq20yD3l5bomR";
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      req.session = {
        nonce: nonce,
      };

      const { signature } = await calculateSiwe(nonce, privateKey);

      body.message = "badmsg";
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

      const { msg, signature } = await calculateSiwe({
        nonce,
        privateKey,
        domain: "blockexplorer.com",
        scheme: "https",
      });
      const badSig = Buffer.from(signature.replace("0x", ""), "hex");
      badSig[badSig.length - 1] = ~badSig[badSig.length - 1] & 0xff; // change 1 byte

      body.message = msg;
      body.signature = `0x${badSig.toString("hex")}`;

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
      const { msg, signature } = await calculateSiwe({
        scheme: "https",
        domain: "blockexplorer.com",
        nonce,
        privateKey,
        expiresAt,
      });

      body.message = msg;
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
      const { siwe, address } = await calculateSiwe({ nonce, privateKey });
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
      const { siwe: siweMsg } = await calculateSiwe({ nonce, privateKey });
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

      await expect(() => controller.token(req)).rejects.toThrow(
        new BadRequestException({ message: "Failed to generate token" })
      );
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
      await expect(() => controller.token(req)).rejects.toThrow(new BadRequestException("Failed to generate token"));
    });
  });
});
