import { AuthMiddleware, isApiRoutePathname } from "./auth.middleware";
import { AddUserRolesPipe } from "../api/pipes/addUserRoles.pipe";
import { mock } from "jest-mock-extended";
import { Request, Response } from "express";
import { UnauthorizedException, ForbiddenException, BadGatewayException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrividiumApiError } from "../errors/prividiumApiError";
import { ExplorerSessionVerifier } from "../auth/explorerSession";

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
  let verifier: { verify: jest.Mock };
  const buildMiddleware = () => new AuthMiddleware(configServiceMock, verifier as unknown as ExplorerSessionVerifier);

  beforeEach(() => {
    verifier = { verify: jest.fn().mockResolvedValue(undefined) };
  });

  it("allows traffic for unprotected route", async () => {
    const middleware = buildMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/auth/login";
    const res = mock<Response>();
    const next = jest.fn();
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks traffic for protected route when no cookie", async () => {
    const middleware = buildMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/protected";
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks traffic for protected route when invalid address", async () => {
    const middleware = buildMiddleware();
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
    const middleware = buildMiddleware();
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

  it("verifies the session token behind the cookie", async () => {
    const middleware = buildMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/protected";
    req.session = {
      address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
      wallets: ["0x36Ea1B6673eA6269014D6cA0AdCca6598f618319"],
      token: "mock-token",
      expiresAt: new Date(2100, 1, 1).toISOString(),
    };
    const next = jest.fn();
    await middleware.use(req, mock<Response>(), next);
    expect(verifier.verify).toHaveBeenCalledWith("https://permissions-api.example.com", "mock-token");
    expect(req.session.audienceChecked).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  it("accepts a previously checked cookie on a fresh pod while current-session is unavailable", async () => {
    verifier.verify.mockRejectedValue(new Error("Unexpected 429 response from permissions API"));
    const req = mock<Request>();
    req.originalUrl = "/blocks";
    req.session = {
      address: "0x123",
      wallets: ["0x123"],
      token: "mock-token",
      expiresAt: new Date(2100, 1, 1).toISOString(),
      audienceChecked: true,
    };
    const next = jest.fn();

    await buildMiddleware().use(req, mock<Response>(), next);

    expect(verifier.verify).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("does not treat a non-boolean audience marker as verified", async () => {
    verifier.verify.mockRejectedValue(new PrividiumApiError("Token was not issued for the block explorer", 403));
    const req = mock<Request>();
    req.originalUrl = "/blocks";
    req.session = {
      address: "0x123",
      wallets: ["0x123"],
      token: "foreign-token",
      expiresAt: new Date(2100, 1, 1).toISOString(),
    };
    Object.assign(req.session, { audienceChecked: "true" });

    await expect(buildMiddleware().use(req, mock<Response>(), jest.fn())).rejects.toThrow(PrividiumApiError);
    expect(req.session).toBeNull();
  });

  it("answers the session introspection route from the cookie without verifying the token", async () => {
    verifier.verify.mockRejectedValue(new Error("ECONNREFUSED"));
    const middleware = buildMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/auth/me";
    req.session = {
      address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
      wallets: ["0x36Ea1B6673eA6269014D6cA0AdCca6598f618319"],
      token: "mock-token",
      expiresAt: new Date(2100, 1, 1).toISOString(),
    };
    const next = jest.fn();
    await middleware.use(req, mock<Response>(), next);
    expect(verifier.verify).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(req.session.audienceChecked).toBeUndefined();
  });

  it("clears the cookie session and blocks traffic when its token was issued to another application", async () => {
    verifier.verify.mockRejectedValue(new PrividiumApiError("Token was not issued for the block explorer", 403));
    const middleware = buildMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/protected";
    req.session = {
      address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
      wallets: ["0x36Ea1B6673eA6269014D6cA0AdCca6598f618319"],
      token: "foreign-token",
      expiresAt: new Date(2100, 1, 1).toISOString(),
    };
    const next = jest.fn();
    await expect(middleware.use(req, mock<Response>(), next)).rejects.toThrow(
      new PrividiumApiError({ message: "Token was not issued for the block explorer" }, 401)
    );
    expect(req.session).toBeNull();
    expect(next).not.toHaveBeenCalled();
  });

  it("keeps the cookie session and throws BadGatewayException when the session check fails upstream", async () => {
    verifier.verify.mockRejectedValue(new Error("ECONNREFUSED"));
    const middleware = buildMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/protected";
    req.session = {
      address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
      wallets: ["0x36Ea1B6673eA6269014D6cA0AdCca6598f618319"],
      token: "mock-token",
      expiresAt: new Date(2100, 1, 1).toISOString(),
    };
    const next = jest.fn();
    await expect(middleware.use(req, mock<Response>(), next)).rejects.toThrow(BadGatewayException);
    expect(req.session).not.toBeNull();
    expect(req.session.audienceChecked).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });

  it("does not allow traffic for protected route when token is expired", async () => {
    const middleware = buildMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/protected";
    req.session = {
      address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
      wallets: ["0x36Ea1B6673eA6269014D6cA0AdCca6598f618319"],
      token: "mock-token",
      expiresAt: new Date(1980, 1, 1).toISOString(),
      audienceChecked: true,
    };
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(
      new PrividiumApiError({ message: "Session expired" }, 401)
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks traffic for api route without auth", async () => {
    const middleware = buildMiddleware();
    const req = mock<Request>();
    req.originalUrl = "/api";
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks traffic for api route when auth header is invalid", async () => {
    const middleware = buildMiddleware();
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
    const middleware = buildMiddleware();
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
    const middleware = buildMiddleware();
    const req = mock<Request>();
    req.headers = {
      authorization: "Bearer token",
    };
    req.originalUrl = "/api";
    const res = mock<Response>();
    const next = jest.fn();
    await middleware.use(req, res, next);
    expect(verifier.verify).toHaveBeenCalledWith("https://permissions-api.example.com", "token");
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
      verifier.verify.mockRejectedValue(new PrividiumApiError("Token was not issued for the block explorer", 403));
      const middleware = buildMiddleware();
      const next = jest.fn();
      await expect(middleware.use(fullReadRequest(), mock<Response>(), next)).rejects.toThrow(
        new PrividiumApiError("Token was not issued for the block explorer", 403)
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("throws BadGatewayException when the session check fails upstream", async () => {
      verifier.verify.mockRejectedValue(new Error("ECONNREFUSED"));
      const middleware = buildMiddleware();
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
      const middleware = buildMiddleware();
      const next = jest.fn();
      await middleware.use(apiKeyRequest(), mock<Response>(), next);
      expect(next).toHaveBeenCalled();
      expect(verifier.verify).not.toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalledWith(new URL("https://permissions-api.example.com/api/m2m-app-queries/me"), {
        headers: { "x-api-key": "m2m-api-key", "X-Forwarded-For": "203.0.113.7" },
      });
    });

    it("blocks traffic when the m2m app has no full read access", async () => {
      mockM2mAppResponse([{ roleName: "deployer", systemPermissions: ["contract_deployment"], organizationId: null }]);
      const middleware = buildMiddleware();
      const next = jest.fn();
      await expect(middleware.use(apiKeyRequest(), mock<Response>(), next)).rejects.toThrow(ForbiddenException);
      expect(next).not.toHaveBeenCalled();
    });

    it("ignores read permissions granted by organization-scoped roles", async () => {
      mockM2mAppResponse([{ roleName: "org-reader", systemPermissions: ["full_read_access"], organizationId: "org1" }]);
      const middleware = buildMiddleware();
      const next = jest.fn();
      await expect(middleware.use(apiKeyRequest(), mock<Response>(), next)).rejects.toThrow(ForbiddenException);
      expect(next).not.toHaveBeenCalled();
    });

    it("throws PrividiumApiError 401 when the permissions API rejects the api key", async () => {
      fetchSpy.mockResolvedValueOnce({ status: 401, json: jest.fn() });
      const middleware = buildMiddleware();
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
      const middleware = buildMiddleware();
      const next = jest.fn();
      await expect(middleware.use(apiKeyRequest(), mock<Response>(), next)).rejects.toThrow(BadGatewayException);
      expect(next).not.toHaveBeenCalled();
    });

    it.each([[""], [["key1", "key2"]]])("blocks traffic without a usable api key (%p)", async (apiKey) => {
      const middleware = buildMiddleware();
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
      const middleware = buildMiddleware();
      const req = apiKeyRequest();
      req.headers.authorization = "Bearer token";
      const next = jest.fn();
      await middleware.use(req, mock<Response>(), next);
      expect(transform).toHaveBeenCalledWith({ address: "", wallets: [], token: "token" });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("api route with a session cookie", () => {
    const sessionRequest = (session: Partial<Request["session"]> = {}) => {
      const req = mock<Request>();
      req.originalUrl = "/api/contract/verifysourcecode";
      req.session = {
        address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
        wallets: ["0x36Ea1B6673eA6269014D6cA0AdCca6598f618319"],
        token: "session-token",
        expiresAt: new Date(2100, 1, 1).toISOString(),
        audienceChecked: true,
        ...session,
      };
      return req;
    };

    const mockSessionUser = (permissions: { hasFullReadAccess: boolean; hasFullWriteAccess?: boolean }) => {
      const transform = jest.fn().mockResolvedValue(permissions);
      (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({ transform }));
      return transform;
    };

    it("allows traffic with full read access, checking the live roles and wallet of the session", async () => {
      const transform = mockSessionUser({ hasFullReadAccess: true, hasFullWriteAccess: false });
      const req = sessionRequest();
      const next = jest.fn();
      await buildMiddleware().use(req, mock<Response>(), next);
      expect(transform).toHaveBeenCalledWith({
        address: "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319",
        wallets: ["0x36Ea1B6673eA6269014D6cA0AdCca6598f618319"],
        token: "session-token",
      });
      expect(req.identity).toEqual({ hasFullReadAccess: true, hasFullWriteAccess: false });
      expect(next).toHaveBeenCalled();
    });

    it("records full write access of the session user", async () => {
      mockSessionUser({ hasFullReadAccess: true, hasFullWriteAccess: true });
      const req = sessionRequest();
      await buildMiddleware().use(req, mock<Response>(), jest.fn());
      expect(req.identity).toEqual({ hasFullReadAccess: true, hasFullWriteAccess: true });
    });

    it("blocks traffic without full read access", async () => {
      mockSessionUser({ hasFullReadAccess: false, hasFullWriteAccess: false });
      const next = jest.fn();
      await expect(buildMiddleware().use(sessionRequest(), mock<Response>(), next)).rejects.toThrow(ForbiddenException);
      expect(next).not.toHaveBeenCalled();
    });

    it("clears the session and blocks traffic when the session is expired", async () => {
      const transform = mockSessionUser({ hasFullReadAccess: true });
      const req = sessionRequest({ expiresAt: new Date(1980, 1, 1).toISOString() });
      await expect(buildMiddleware().use(req, mock<Response>(), jest.fn())).rejects.toThrow(
        new PrividiumApiError({ message: "Session expired" }, 401)
      );
      expect(transform).not.toHaveBeenCalled();
      expect(req.session).toBeNull();
    });

    it("verifies the token of a session without the audience marker", async () => {
      verifier.verify.mockRejectedValue(new PrividiumApiError("Token was not issued for the block explorer", 403));
      const transform = mockSessionUser({ hasFullReadAccess: true });
      const req = sessionRequest({ audienceChecked: undefined });
      await expect(buildMiddleware().use(req, mock<Response>(), jest.fn())).rejects.toThrow(PrividiumApiError);
      expect(transform).not.toHaveBeenCalled();
      expect(req.session).toBeNull();
    });

    it("clears the session when the permissions API rejects its token or selected wallet", async () => {
      (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({
        transform: jest.fn().mockRejectedValue(new PrividiumApiError("Authentication failed", 401)),
      }));
      const req = sessionRequest();
      const next = jest.fn();
      await expect(buildMiddleware().use(req, mock<Response>(), next)).rejects.toThrow(
        new PrividiumApiError("Authentication failed", 401)
      );
      expect(req.session).toBeNull();
      expect(next).not.toHaveBeenCalled();
    });

    it("keeps the session when the permissions API is unavailable", async () => {
      (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({
        transform: jest.fn().mockRejectedValue(new BadGatewayException("Auth service unavailable")),
      }));
      const req = sessionRequest();
      await expect(buildMiddleware().use(req, mock<Response>(), jest.fn())).rejects.toThrow(BadGatewayException);
      expect(req.session).not.toBeNull();
    });

    it("uses the bearer token when both a bearer token and a session are sent", async () => {
      const transform = mockSessionUser({ hasFullReadAccess: true, hasFullWriteAccess: false });
      const req = sessionRequest();
      req.headers = { authorization: "Bearer token" };
      await buildMiddleware().use(req, mock<Response>(), jest.fn());
      expect(transform).toHaveBeenCalledWith({ address: "", wallets: [], token: "token" });
    });
  });

  describe("api access recorded for bearer tokens and m2m app api keys", () => {
    it("records full write access of a bearer token user", async () => {
      (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({
        transform: jest.fn().mockResolvedValue({ hasFullReadAccess: true, hasFullWriteAccess: true }),
      }));
      const req = mock<Request>();
      req.headers = { authorization: "Bearer token" };
      req.originalUrl = "/api";
      await buildMiddleware().use(req, mock<Response>(), jest.fn());
      expect(req.identity).toEqual({ hasFullReadAccess: true, hasFullWriteAccess: true });
    });

    it("records full write access of an m2m app", async () => {
      const fetchSpy: jest.SpyInstance = jest.spyOn(global, "fetch");
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          id: "app",
          roles: [{ roleName: "verifier", systemPermissions: ["full_sequencer_rpc_access"], organizationId: null }],
        }),
      });
      try {
        const req = mock<Request>();
        req.headers = { "x-api-key": "m2m-api-key" };
        req.originalUrl = "/api";
        await buildMiddleware().use(req, mock<Response>(), jest.fn());
        expect(req.identity).toEqual({ hasFullReadAccess: true, hasFullWriteAccess: true });
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it("records no full write access for an m2m app with full read access only", async () => {
      const fetchSpy: jest.SpyInstance = jest.spyOn(global, "fetch");
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          id: "app",
          roles: [{ roleName: "indexer", systemPermissions: ["full_read_access"], organizationId: null }],
        }),
      });
      try {
        const req = mock<Request>();
        req.headers = { "x-api-key": "m2m-api-key" };
        req.originalUrl = "/api";
        await buildMiddleware().use(req, mock<Response>(), jest.fn());
        expect(req.identity).toEqual({ hasFullReadAccess: true, hasFullWriteAccess: false });
      } finally {
        fetchSpy.mockRestore();
      }
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
      "classifies %s as an api route and enforces full read access for a valid session",
      async (originalUrl) => {
        (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({
          transform: jest.fn().mockResolvedValue({ hasFullReadAccess: false }),
        }));
        const middleware = buildMiddleware();
        const req = mock<Request>();
        req.originalUrl = originalUrl;
        req.session = validSession();
        const res = mock<Response>();
        const next = jest.fn();
        await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
        expect(next).not.toHaveBeenCalled();
      }
    );

    it("still enforces full read access on an upper-case api route when a bearer token is supplied", async () => {
      (AddUserRolesPipe as jest.Mock).mockImplementation(() => ({
        transform: jest.fn().mockResolvedValue({ hasFullReadAccess: false }),
      }));
      const middleware = buildMiddleware();
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
      const middleware = buildMiddleware();
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
