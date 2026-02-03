import { AuthMiddleware } from "./auth.middleware";
import { AddUserRolesPipe } from "../api/pipes/addUserRoles.pipe";
import { mock } from "jest-mock-extended";
import { Request, Response } from "express";
import { UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrividiumApiError } from "../errors/prividiumApiError";

jest.mock("../api/pipes/addUserRoles.pipe", () => {
  return {
    AddUserRolesPipe: jest.fn(),
  };
});

const configServiceMock = mock<ConfigService>();

describe("AuthMiddleware", () => {
  it("allows traffic for unprotected route", async () => {
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.originalUrl = "/auth/login";
    const res = mock<Response>();
    const next = jest.fn();
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks traffic for protected route when no cookie", async () => {
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.originalUrl = "/protected";
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks traffic for protected route when invalid address", async () => {
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.originalUrl = "/protected";
    req.session = {
      address: "invalid-address",
      token: "mock-token",
    };
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows traffic for protected route when cookie is set", async () => {
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.originalUrl = "/protected";
    req.session = {
      address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
      wallets: ["0x36Ea1B6673eA6269014D6cA0AdCca6598f618319"],
      token: "mock-token",
      expiresAt: new Date(2100, 1, 1).toISOString(),
    };
    const res = mock<Response>();
    const next = jest.fn();
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("does not allow traffic for protected route when token is expired", async () => {
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.originalUrl = "/protected";
    req.session = {
      address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
      wallets: ["0x36Ea1B6673eA6269014D6cA0AdCca6598f618319"],
      token: "mock-token",
      expiresAt: new Date(1980, 1, 1).toISOString(),
    };
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(
      new PrividiumApiError({ message: "Session expired" }, 401)
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks traffic for api route without auth", async () => {
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.originalUrl = "/api";
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks traffic for api route when auth header is invalid", async () => {
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.headers = {
      authorization: "invalid-header",
    };
    req.originalUrl = "/api";
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks traffic for api route when user is not admin", async () => {
    (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({
      transform: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    }));
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.headers = {
      authorization: "Bearer token",
    };
    req.originalUrl = "/api";
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows traffic for api route when user is admin", async () => {
    (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({
      transform: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    }));
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.headers = {
      authorization: "Bearer token",
    };
    req.originalUrl = "/api";
    const res = mock<Response>();
    const next = jest.fn();
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
