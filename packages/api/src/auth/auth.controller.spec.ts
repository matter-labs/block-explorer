import { AuthController } from "./auth.controller";
import { mock } from "jest-mock-extended";
import { Request } from "express";
import { VerifySignatureDto } from "./auth.dto";
import { HttpException, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

jest.mock("@nestjs/common", () => ({
  ...jest.requireActual("@nestjs/common"),
  Logger: jest.fn().mockReturnValue({
    error: jest.fn(),
  }),
}));

describe("AuthController", () => {
  let controller: AuthController;
  let req: Request;
  let configServiceMock: ConfigService;
  const mockWalletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const mockToken = "mock-jwt-token";
  const configServiceValues = {
    "prividium.permissionsApiUrl": "https://permissions-api.example.com",
  };

  beforeEach(() => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => configServiceValues[key]),
    });
    controller = new AuthController(configServiceMock);
    req = mock<Request>();
  });

  describe("login", () => {
    let body: VerifySignatureDto;
    let fetchSpy: jest.SpyInstance;

    beforeEach(() => {
      body = { token: mockToken };
      fetchSpy = jest.spyOn(global, "fetch");
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it("logins successfully with valid token", async () => {
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          wallets: [mockWalletAddress],
        }),
      });

      const result = await controller.login(body, req);

      expect(result).toEqual({ address: mockWalletAddress });
      expect(req.session.address).toBe(mockWalletAddress);
      expect(req.session.token).toBe(mockToken);
      expect(fetchSpy).toHaveBeenCalledWith(expect.any(URL), {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
    });

    it("throws 400 error for 403 response from permissions API", async () => {
      fetchSpy.mockResolvedValueOnce({
        status: 403,
        json: jest.fn(),
      });

      await expect(controller.login(body, req)).rejects.toThrow(new HttpException("Invalid or expired token", 400));
    });

    it("throws internal server error for invalid API response", async () => {
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({ invalid: "response" }),
      });

      await expect(controller.login(body, req)).rejects.toThrow(InternalServerErrorException);
    });

    it("throws internal server error for network errors", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Network error"));

      await expect(controller.login(body, req)).rejects.toThrow(
        new InternalServerErrorException("Authentication failed")
      );
    });

    it("throws 400 error for empty wallets array", async () => {
      fetchSpy.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({ wallets: [] }),
      });

      await expect(controller.login(body, req)).rejects.toThrow(
        new HttpException("No wallets associated with the user", 400)
      );
    });
  });

  describe("logout", () => {
    it("sets session to null", () => {
      req.session = {
        address: mockWalletAddress,
        token: mockToken,
      };
      controller.logout(req);
      expect(req.session).toEqual(null);
    });
  });

  describe("GET /me", () => {
    it("returns address stored in session", async () => {
      req.session = { address: mockWalletAddress };
      const res = await controller.me(req);
      expect(res).toEqual({ address: mockWalletAddress });
    });
  });
});
