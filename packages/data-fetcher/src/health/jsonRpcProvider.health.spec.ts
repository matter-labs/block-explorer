import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { JsonRpcProviderBase } from "../rpcProvider";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { AxiosError } from "axios";

describe("JsonRpcHealthIndicator", () => {
  let jsonRpcProviderMock: JsonRpcProviderBase;
  let jsonRpcHealthIndicator: JsonRpcHealthIndicator;
  let httpService: HttpService;
  let configService: ConfigService;

  const getHealthIndicator = async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        JsonRpcHealthIndicator,
        {
          provide: JsonRpcProviderBase,
          useValue: jsonRpcProviderMock,
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());
    return app.get<JsonRpcHealthIndicator>(JsonRpcHealthIndicator);
  };

  beforeEach(async () => {
    jsonRpcProviderMock = mock<JsonRpcProviderBase>();

    httpService = mock<HttpService>({
      post: jest.fn(),
    });

    configService = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => {
        if (key === "blockchain.rpcUrl") return "http://localhost:3050";
        if (key === "healthChecks.rpcHealthCheckTimeoutMs") return 5000;
        return null;
      }),
    });

    jsonRpcHealthIndicator = await getHealthIndicator();
  });

  describe("isHealthy", () => {
    const rpcRequest = {
      id: 1,
      jsonrpc: "2.0",
      method: "eth_chainId",
      params: [],
    };

    it("returns healthy status when RPC responds successfully", async () => {
      (httpService.post as jest.Mock).mockReturnValueOnce(of({ data: { result: "0x1" } }));
      const result = await jsonRpcHealthIndicator.isHealthy("jsonRpcProvider");
      expect(result).toEqual({
        jsonRpcProvider: {
          status: "up",
        },
      });
      expect(httpService.post).toHaveBeenCalledWith("http://localhost:3050", rpcRequest, { timeout: 5000 });
    });

    it("throws HealthCheckError when RPC request fails", async () => {
      const error = new AxiosError();
      error.response = {
        status: 503,
        data: "Service Unavailable",
      } as any;

      (httpService.post as jest.Mock).mockReturnValueOnce(throwError(() => error));
      await expect(jsonRpcHealthIndicator.isHealthy("jsonRpcProvider")).rejects.toThrow();
      expect(httpService.post).toHaveBeenCalledWith("http://localhost:3050", rpcRequest, { timeout: 5000 });
    });

    it("throws HealthCheckError when RPC request times out", async () => {
      const error = new AxiosError();
      error.code = "ECONNABORTED";

      (httpService.post as jest.Mock).mockReturnValueOnce(throwError(() => error));
      await expect(jsonRpcHealthIndicator.isHealthy("jsonRpcProvider")).rejects.toThrow();
      expect(httpService.post).toHaveBeenCalledWith("http://localhost:3050", rpcRequest, { timeout: 5000 });
    });

    it("uses configured timeout from config service", async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === "blockchain.rpcUrl") return "http://localhost:3050";
        if (key === "healthChecks.rpcHealthCheckTimeoutMs") return 10000;
        return null;
      });
      jsonRpcHealthIndicator = await getHealthIndicator();

      (httpService.post as jest.Mock).mockReturnValueOnce(of({ data: { result: "0x1" } }));
      await jsonRpcHealthIndicator.isHealthy("jsonRpcProvider");
      expect(httpService.post).toHaveBeenCalledWith("http://localhost:3050", rpcRequest, { timeout: 10000 });
    });
  });
});
