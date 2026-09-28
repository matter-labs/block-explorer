import { AuthMiddleware } from "./auth.middleware";
import { mock } from "jest-mock-extended";
import { Request, Response } from "express";
import { BadGatewayException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

describe("AuthMiddleware", () => {
  const mockWalletAddress = "0x36Ea1B6673eA6269014D6cA0AdCca6598f618319";
  const mockWalletAddress2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const configServiceValues = {
    "prividium.permissionsApiUrl": "https://permissions-api.example.com",
  };
  let middleware: AuthMiddleware;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    const configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => configServiceValues[key]),
    });
    middleware = new AuthMiddleware(configServiceMock);
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("allows traffic for unprotected route", async () => {
    const req = mock<Request>();
    req.originalUrl = "/auth/login";
    const res = mock<Response>();
    const next = jest.fn();
    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blocks traffic for protected route when no cookie", async () => {
    const req = mock<Request>();
    req.originalUrl = "/protected";
    const res = mock<Response>();
    const next = jest.fn();
    await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks traffic for protected route when invalid address", async () => {
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

  describe("when cookie is set", () => {
    let req: Request;
    let next: jest.Mock;

    beforeEach(() => {
      req = mock<Request>();
      req.originalUrl = "/protected";
      req.session = {
        address: mockWalletAddress,
        wallets: [mockWalletAddress, mockWalletAddress2],
        token: "mock-token",
      };
      next = jest.fn();
    });

    it("allows traffic and refreshes the wallets when the selected wallet is still assigned to the user", async () => {
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({ wallets: [mockWalletAddress.toLowerCase()] }),
      });
      await middleware.use(req, mock<Response>(), next);
      expect(next).toHaveBeenCalled();
      expect(req.session.wallets).toEqual([mockWalletAddress.toLowerCase()]);
      expect(fetchSpy).toHaveBeenCalledWith(new URL("https://permissions-api.example.com/api/user-wallets"), {
        headers: { Authorization: "Bearer mock-token" },
        signal: expect.any(AbortSignal),
      });
    });

    it("blocks traffic and clears the session when the selected wallet is no longer assigned to the user", async () => {
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({ wallets: [mockWalletAddress2] }),
      });
      await expect(middleware.use(req, mock<Response>(), next)).rejects.toThrow(UnauthorizedException);
      expect(next).not.toHaveBeenCalled();
      expect(req.session).toBeNull();
    });

    it("blocks traffic and clears the session when the token is unauthorized", async () => {
      fetchSpy.mockResolvedValueOnce({ status: 401, json: jest.fn() });
      await expect(middleware.use(req, mock<Response>(), next)).rejects.toThrow(UnauthorizedException);
      expect(next).not.toHaveBeenCalled();
      expect(req.session).toBeNull();
    });

    it("blocks traffic and clears the session when the token is forbidden", async () => {
      fetchSpy.mockResolvedValueOnce({ status: 403, json: jest.fn() });
      await expect(middleware.use(req, mock<Response>(), next)).rejects.toThrow(UnauthorizedException);
      expect(next).not.toHaveBeenCalled();
      expect(req.session).toBeNull();
    });

    it("throws BadGatewayException and keeps the session when permissions API request fails", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Network error"));
      await expect(middleware.use(req, mock<Response>(), next)).rejects.toThrow(BadGatewayException);
      expect(next).not.toHaveBeenCalled();
      expect(req.session.address).toBe(mockWalletAddress);
    });

    it("throws BadGatewayException and keeps the session when permissions API returns an error", async () => {
      fetchSpy.mockResolvedValueOnce({ status: 500, json: jest.fn() });
      await expect(middleware.use(req, mock<Response>(), next)).rejects.toThrow(BadGatewayException);
      expect(next).not.toHaveBeenCalled();
      expect(req.session.address).toBe(mockWalletAddress);
    });

    it("throws BadGatewayException and keeps the session when permissions API response is invalid", async () => {
      fetchSpy.mockResolvedValueOnce({ status: 200, json: jest.fn().mockResolvedValue({ invalid: "response" }) });
      await expect(middleware.use(req, mock<Response>(), next)).rejects.toThrow(BadGatewayException);
      expect(next).not.toHaveBeenCalled();
      expect(req.session.address).toBe(mockWalletAddress);
    });
  });
});
