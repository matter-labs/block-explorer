import { AuthMiddleware } from "./auth.middleware";
import { mock } from "jest-mock-extended";
import { Request, Response } from "express";
import { UnauthorizedException } from "@nestjs/common";

describe("AuthMiddleware", () => {
  it("allows traffic for unprotected route", () => {
    const middleware = new AuthMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/auth/login";
    const res = mock<Response>();
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks traffic for protected route when no cookie", () => {
    const middleware = new AuthMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/protected";
    const res = mock<Response>();
    const next = jest.fn();
    expect(() => middleware.use(req, res, next)).toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks traffic for protected route when invalid address", () => {
    const middleware = new AuthMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/protected";
    req.session = {
      address: "invalid-address",
      token: "mock-token",
    };
    const res = mock<Response>();
    const next = jest.fn();
    expect(() => middleware.use(req, res, next)).toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows traffic for protected route when cookie is set", () => {
    const middleware = new AuthMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/protected";
    req.session = {
      address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
      token: "mock-token",
    };
    const res = mock<Response>();
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
