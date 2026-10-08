import { AuthMiddleware, isApiRoutePathname } from "./auth.middleware";
import { AddUserRolesPipe } from "../api/pipes/addUserRoles.pipe";
import { mock } from "jest-mock-extended";
import { Request, Response } from "express";
import { UnauthorizedException, ForbiddenException, BadGatewayException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrividiumApiError } from "../errors/prividiumApiError";
import { ExplorerSessionVerifier } from "../auth/explorerSession";

jest.mock("../auth/explorerSession");

jest.mock("../api/pipes/addUserRoles.pipe", () => {
  return {
    ...jest.requireActual("../api/pipes/addUserRoles.pipe"),
    AddUserRolesPipe: jest.fn(),
  };
});

const configServiceMock = mock<ConfigService>({
  get: jest
    .fn()
    .mockImplementation((key: string) =>
      key === "prividium.permissionsApiUrl" ? "https://permissions-api.example.com" : undefined
    ),
});

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
    const assertExplorerSession = jest.fn().mockResolvedValue(undefined);
    (ExplorerSessionVerifier as jest.Mock).mockImplementationOnce(() => ({ assert: assertExplorerSession }));
    const middleware = new AuthMiddleware(configServiceMock);
    const req = mock<Request>();
    req.headers = {
      authorization: "Bearer token",
    };
    req.originalUrl = "/api";
    const res = mock<Response>();
    const next = jest.fn();
    await middleware.use(req, res, next);
    expect(assertExplorerSession).toHaveBeenCalledWith("https://permissions-api.example.com", "token");
    expect(next).toHaveBeenCalled();
  });

  describe("api route with a bearer token of a user with full read access", () => {
    const fullReadRequest = () => {
      (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({
        transform: jest.fn().mockResolvedValue({ hasFullReadAccess: true }),
      }));
      const req = mock<Request>();
      req.headers = { authorization: "Bearer token" };
      req.originalUrl = "/api";
      return req;
    };

    it("blocks traffic when the token was issued to another application", async () => {
      (ExplorerSessionVerifier as jest.Mock).mockImplementationOnce(() => ({
        assert: jest.fn().mockRejectedValue(new PrividiumApiError("Token was not issued for the block explorer", 403)),
      }));
      const middleware = new AuthMiddleware(configServiceMock);
      const next = jest.fn();
      await expect(middleware.use(fullReadRequest(), mock<Response>(), next)).rejects.toThrow(
        new PrividiumApiError("Token was not issued for the block explorer", 403)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("throws BadGatewayException when the session check fails upstream", async () => {
      (ExplorerSessionVerifier as jest.Mock).mockImplementationOnce(() => ({
        assert: jest.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      }));
      const middleware = new AuthMiddleware(configServiceMock);
      const next = jest.fn();
      await expect(middleware.use(fullReadRequest(), mock<Response>(), next)).rejects.toThrow(BadGatewayException);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("api route with m2m app api key", () => {
    let fetchSpy: jest.SpyInstance;

    const apiKeyRequest = (apiKey: string | string[] = "m2m-api-key") => {
      const req = mock<Request>();
      req.headers = { "x-api-key": apiKey };
      req.originalUrl = "/api/account/txlist";
      Object.defineProperty(req, "ip", { value: "203.0.113.7" });
      return req;
    };

    const mockM2mAppResponse = (roles: unknown[]) =>
      fetchSpy.mockResolvedValueOnce({ status: 200, json: jest.fn().mockResolvedValue({ id: "app", roles }) });

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, "fetch");
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it("allows traffic when the m2m app has full read access and forwards the client ip", async () => {
      mockM2mAppResponse([{ roleName: "indexer", systemPermissions: ["full_read_access"], organizationId: null }]);
      const middleware = new AuthMiddleware(configServiceMock);
      const next = jest.fn();
      await middleware.use(apiKeyRequest(), mock<Response>(), next);
      expect(next).toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalledWith(new URL("https://permissions-api.example.com/api/m2m-app-queries/me"), {
        headers: { "x-api-key": "m2m-api-key", "X-Forwarded-For": "203.0.113.7" },
      });
    });

    it("blocks traffic when the m2m app has no full read access", async () => {
      mockM2mAppResponse([{ roleName: "reader", systemPermissions: ["admin_read"], organizationId: null }]);
      const middleware = new AuthMiddleware(configServiceMock);
      const next = jest.fn();
      await expect(middleware.use(apiKeyRequest(), mock<Response>(), next)).rejects.toThrow(ForbiddenException);
      expect(next).not.toHaveBeenCalled();
    });

    it("ignores read permissions granted by organization-scoped roles", async () => {
      mockM2mAppResponse([{ roleName: "org-reader", systemPermissions: ["full_read_access"], organizationId: "org1" }]);
      const middleware = new AuthMiddleware(configServiceMock);
      const next = jest.fn();
      await expect(middleware.use(apiKeyRequest(), mock<Response>(), next)).rejects.toThrow(ForbiddenException);
      expect(next).not.toHaveBeenCalled();
    });

    it("throws PrividiumApiError 401 when the permissions API rejects the api key", async () => {
      fetchSpy.mockResolvedValueOnce({ status: 401, json: jest.fn() });
      const middleware = new AuthMiddleware(configServiceMock);
      const next = jest.fn();
      await expect(middleware.use(apiKeyRequest(), mock<Response>(), next)).rejects.toThrow(
        new PrividiumApiError("Authentication failed", 401)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it.each([
      ["returns a non-401 error status", () => fetchSpy.mockResolvedValueOnce({ status: 500, json: jest.fn() })],
      [
        "returns an invalid body",
        () => fetchSpy.mockResolvedValueOnce({ status: 200, json: jest.fn().mockResolvedValue({ roles: "x" }) }),
      ],
      [
        "returns non parseable json",
        () => fetchSpy.mockResolvedValueOnce({ status: 200, json: jest.fn().mockRejectedValue(new Error()) }),
      ],
      ["is unreachable", () => fetchSpy.mockRejectedValueOnce(new Error("ECONNREFUSED"))],
    ])("throws BadGatewayException when the permissions API %s", async (_, mockResponse) => {
      mockResponse();
      const middleware = new AuthMiddleware(configServiceMock);
      const next = jest.fn();
      await expect(middleware.use(apiKeyRequest(), mock<Response>(), next)).rejects.toThrow(BadGatewayException);
      expect(next).not.toHaveBeenCalled();
    });

    it.each([[""], [["key1", "key2"]]])("blocks traffic without a usable api key (%p)", async (apiKey) => {
      const middleware = new AuthMiddleware(configServiceMock);
      const next = jest.fn();
      await expect(middleware.use(apiKeyRequest(apiKey), mock<Response>(), next)).rejects.toThrow(
        UnauthorizedException
      );
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("uses the bearer token when both a bearer token and an api key are sent", async () => {
      const transform = jest.fn().mockResolvedValue({ hasFullReadAccess: true });
      (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({ transform }));
      const middleware = new AuthMiddleware(configServiceMock);
      const req = apiKeyRequest();
      req.headers.authorization = "Bearer token";
      const next = jest.fn();
      await middleware.use(req, mock<Response>(), next);
      expect(transform).toHaveBeenCalledWith({ address: "", wallets: [], token: "token" });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
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
