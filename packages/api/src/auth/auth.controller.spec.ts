import { AuthController } from "./auth.controller";
import { mock } from "jest-mock-extended";
import { Request } from "express";
import { VerifySignatureDto, SwitchWalletDto } from "./auth.dto";
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
  const mockWalletAddress2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
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
      const mockWallets = [mockWalletAddress, mockWalletAddress2];
      const mockRoles = [{ roleName: "admin" }, { roleName: "user" }];
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            wallets: mockWallets,
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            type: "user",
            expiresAt: new Date().toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            roles: mockRoles,
          }),
        });

      const result = await controller.login(body, req);

      expect(result).toEqual({ address: mockWalletAddress, wallets: mockWallets, roles: ["admin", "user"] });
      expect(req.session.address).toBe(mockWalletAddress);
      expect(req.session.wallets).toEqual(mockWallets);
      expect(req.session.roles).toEqual(["admin", "user"]);
      expect(req.session.token).toBe(mockToken);
      expect(fetchSpy).toHaveBeenCalledWith(expect.any(URL), {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
    });

    it("throws 403 error for 403 response from permissions API", async () => {
      fetchSpy.mockResolvedValueOnce({
        status: 403,
        json: jest.fn(),
      });

      await expect(controller.login(body, req)).rejects.toThrow(new HttpException("Invalid or expired token", 403));
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

    it("throws 403 error when roles API returns 403", async () => {
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ wallets: [mockWalletAddress] }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            type: "user",
            expiresAt: new Date().toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          status: 403,
          json: jest.fn(),
        });

      await expect(controller.login(body, req)).rejects.toThrow(new HttpException("Invalid or expired token", 403));
    });

    it("throws internal server error when roles API returns invalid data", async () => {
      fetchSpy
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ wallets: [mockWalletAddress] }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({
            type: "user",
            expiresAt: new Date().toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          status: 200,
          json: jest.fn().mockResolvedValue({ invalid: "response" }),
        });

      await expect(controller.login(body, req)).rejects.toThrow(InternalServerErrorException);
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

  describe("switchWallet", () => {
    let body: SwitchWalletDto;

    beforeEach(() => {
      body = { address: mockWalletAddress2 };
      req.session = {
        address: mockWalletAddress,
        wallets: [mockWalletAddress, mockWalletAddress2],
        token: mockToken,
      };
    });

    it("switches to a valid wallet successfully", async () => {
      const result = await controller.switchWallet(body, req);

      expect(result).toEqual({ address: mockWalletAddress2 });
      expect(req.session.address).toBe(mockWalletAddress2);
    });

    it("throws 403 error when wallet is not in user's wallet list", async () => {
      body.address = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

      await expect(controller.switchWallet(body, req)).rejects.toThrow(
        new HttpException("Wallet not authorized for this user", 403)
      );
    });

    it("throws 403 error when session has no wallets", async () => {
      req.session.wallets = undefined;

      await expect(controller.switchWallet(body, req)).rejects.toThrow(
        new HttpException("Wallet not authorized for this user", 403)
      );
    });

    it("is case-insensitive when validating wallet addresses", async () => {
      body.address = mockWalletAddress2.toUpperCase();

      const result = await controller.switchWallet(body, req);

      expect(result).toEqual({ address: mockWalletAddress2.toUpperCase() });
      expect(req.session.address).toBe(mockWalletAddress2.toUpperCase());
    });
  });

  describe("GET /me", () => {
    it("returns address, wallets and roles stored in session", async () => {
      const mockWallets = [mockWalletAddress, mockWalletAddress2];
      const mockRoles = ["admin", "user"];
      req.session = { address: mockWalletAddress, wallets: mockWallets, roles: mockRoles };
      const res = await controller.me(req);
      expect(res).toEqual({ address: mockWalletAddress, wallets: mockWallets, roles: mockRoles });
    });

    it("returns empty roles array when session has no roles", async () => {
      const mockWallets = [mockWalletAddress, mockWalletAddress2];
      req.session = { address: mockWalletAddress, wallets: mockWallets };
      const res = await controller.me(req);
      expect(res).toEqual({ address: mockWalletAddress, wallets: mockWallets, roles: [] });
    });
  });
});
