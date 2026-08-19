import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import { TokenSupplyService } from "./tokenSupply.service";

describe("TokenSupplyService", () => {
  let fetchSpy: jest.SpyInstance;
  let configServiceMock: ConfigService;
  let service: TokenSupplyService;

  const configServiceValues = {
    "prividium.permissionsApiUrl": "https://permissions-api.example.com/api",
  };
  const user = { address: "0x01", wallets: ["0x01"], token: "token1" };
  const tokenAddress = "0x000000000000000000000000000000000000800A";

  beforeEach(() => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => configServiceValues[key]),
    });
    fetchSpy = jest.spyOn(global, "fetch");
    service = new TokenSupplyService(configServiceMock);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("returns null when there is no session user", async () => {
    expect(await service.getTotalSupply(tokenAddress, null)).toBeNull();
    expect(fetchSpy).not.toBeCalled();
  });

  it("calls the permissions API rpc as the session user", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({ result: "0x06f05b59d3b20000" }),
    });

    await service.getTotalSupply(tokenAddress, user);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url.toString()).toBe("https://permissions-api.example.com/rpc");
    expect(init.headers.Authorization).toBe("Bearer token1");
    expect(JSON.parse(init.body)).toEqual({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: tokenAddress, from: "0x01", data: "0x18160ddd" }, "latest"],
    });
  });

  it("returns the supply as a decimal string", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({ result: "0x06f05b59d3b20000" }),
    });

    expect(await service.getTotalSupply(tokenAddress, user)).toBe("500000000000000000");
  });

  it("returns null when the call is not authorized", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({ error: { code: -32000, message: "Permission check failed" } }),
    });

    expect(await service.getTotalSupply(tokenAddress, user)).toBeNull();
  });

  it("returns null when the contract has no totalSupply", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({ result: "0x" }),
    });

    expect(await service.getTotalSupply(tokenAddress, user)).toBeNull();
  });

  it("returns null when the permissions API is unavailable", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("connection refused"));

    expect(await service.getTotalSupply(tokenAddress, user)).toBeNull();
  });
});
