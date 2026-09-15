import { AuthMiddleware, isApiRoutePathname } from "./auth.middleware";
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
        hasFullReadAccess: false,
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
        hasFullReadAccess: true,
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

  // `/API/...` reaches the `/api/...` handler, so it must hit this gate too.
  describe("api route classification is case-insensitive (route/authorizer parity)", () => {
    const validSession = () => ({
      address: "0x0000000000000000000000000000000000000001",
      token: "session-token",
      wallets: ["0x0000000000000000000000000000000000000001"],
      expiresAt: new Date(2100, 0, 1).toISOString(),
    });

    it.each(["/API", "/API/account/txlist", "/Api/account/txlist", "/aPi/Account/TxList", "/API/logs/getLogs"])(
      "classifies %s as an api route and refuses it without a bearer token, even with a valid session",
      async (originalUrl) => {
        const middleware = new AuthMiddleware(configServiceMock);
        const req = mock<Request>();
        req.originalUrl = originalUrl;
        req.session = validSession();
        const res = mock<Response>();
        const next = jest.fn();
        await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
        expect(next).not.toHaveBeenCalled();
      }
    );

    it("still enforces full read access on an upper-case api route when a bearer token is supplied", async () => {
      (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({
        transform: jest.fn().mockResolvedValue({ hasFullReadAccess: false }),
      }));
      const middleware = new AuthMiddleware(configServiceMock);
      const req = mock<Request>();
      req.headers = { authorization: "Bearer token" };
      req.originalUrl = "/API/account/txlist";
      req.session = validSession();
      const res = mock<Response>();
      const next = jest.fn();
      await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
      expect(next).not.toHaveBeenCalled();
    });

    it("does not over-classify paths that merely start with the api prefix", async () => {
      const middleware = new AuthMiddleware(configServiceMock);
      const req = mock<Request>();
      req.originalUrl = "/apiaries";
      req.session = validSession();
      const res = mock<Response>();
      const next = jest.fn();
      await middleware.use(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("isApiRoutePathname", () => {
    it.each(["/api", "/API", "/api/", "/api/account/txlist", "/API/account/txlist", "/aPi/Account/TxList"])(
      "returns true for %s",
      (pathname) => expect(isApiRoutePathname(pathname)).toBe(true)
    );

    it.each(["/apiaries", "/apifoo", "/transactions", "/auth/login", "/", "/xapi/account"])(
      "returns false for %s",
      (pathname) => expect(isApiRoutePathname(pathname)).toBe(false)
    );

    // Fails if an Api* controller is ever mounted outside `/api`.
    it.each([
      "/api/account/txlist",
      "/api/block/getblockreward",
      "/api/contract/getsourcecode",
      "/api/logs/getLogs",
      "/api/stats/ethprice",
      "/api/token/tokeninfo",
      "/api/transaction/getstatus",
    ])("classifies the registered api route %s", (pathname) => expect(isApiRoutePathname(pathname)).toBe(true));
  });
});
