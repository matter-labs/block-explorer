import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { RpcController } from "./rpc.controller";
import { PrividiumApiError } from "../errors/prividiumApiError";

describe("RpcController", () => {
  let controller: RpcController;
  let configServiceMock: ConfigService;
  let fetchSpy: jest.SpyInstance;

  const configServiceValues = {
    "prividium.permissionsApiUrl": "https://permissions-api.example.com",
  };
  const user = { address: "0x01", wallets: ["0x01"], token: "token1" };
  const body = { jsonrpc: "2.0", id: 1, method: "eth_call", params: [] };

  beforeEach(() => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => configServiceValues[key]),
    });
    controller = new RpcController(configServiceMock);
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("forwards the request with the session token and returns the response", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: "0x1" }),
    });

    expect(await controller.proxy(body, user)).toEqual({ jsonrpc: "2.0", id: 1, result: "0x1" });
    expect(fetchSpy).toBeCalledWith(new URL("https://permissions-api.example.com/rpc"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(body),
    });
  });

  it("rejects requests without a session", async () => {
    await expect(controller.proxy(body, null)).rejects.toThrowError(UnauthorizedException);
    expect(fetchSpy).not.toBeCalled();
  });

  it("throws when the permissions API rejects the token", async () => {
    fetchSpy.mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) });

    await expect(controller.proxy(body, user)).rejects.toThrowError(PrividiumApiError);
  });

  it("throws a bad gateway when the permissions API fails", async () => {
    fetchSpy.mockResolvedValueOnce({ status: 500, ok: false, json: () => Promise.resolve({}) });

    await expect(controller.proxy(body, user)).rejects.toThrowError(expect.objectContaining({ status: 502 }) as Error);
  });

  it("throws a bad gateway when the response is not JSON", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: () => Promise.reject(new SyntaxError("Unexpected token < in JSON")),
    });

    await expect(controller.proxy(body, user)).rejects.toThrowError(expect.objectContaining({ status: 502 }) as Error);
  });
});
