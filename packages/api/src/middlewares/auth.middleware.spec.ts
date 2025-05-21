import { AuthMiddleware } from "./auth.middleware";
import { mock } from "jest-mock-extended";
import { Request, Response } from "express";
import { UnauthorizedException } from "@nestjs/common";
import { SiweMessage } from "siwe";

describe("AuthMiddleware", () => {
  it("allows traffic for unprotected route", () => {
    const middleware = new AuthMiddleware();
    const req = mock<Request>();
    req.baseUrl = "/auth/message";
    const res = mock<Response>();
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks traffic for protected route when no cookie", () => {
    const middleware = new AuthMiddleware();
    const req = mock<Request>();
    req.baseUrl = "/protected";
    const res = mock<Response>();
    const next = jest.fn();
    expect(() => middleware.use(req, res, next)).toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows traffic for protected route when cookie is set", () => {
    const middleware = new AuthMiddleware();
    const req = mock<Request>();
    req.baseUrl = "/protected";
    req.session = {
      siwe: new SiweMessage(
        "localhost wants you to sign in with your Ethereum account:\n0x36Ea1B6673eA6269014D6cA0AdCca6598f618319\n\nSign in with Ethereum\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 1\nNonce: OCLnJ6jNbWdNsxCVl\nIssued At: 2025-05-13T21:38:24.758Z"
      ),
      verified: true,
    };
    const res = mock<Response>();
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
