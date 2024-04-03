import { ServiceUnavailableException, Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { HealthCheckService, HealthCheckResult } from "@nestjs/terminus";
import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { setTimeout } from "node:timers/promises";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";
import { HealthController } from "./health.controller";

jest.mock("node:timers/promises", () => ({
  setTimeout: jest.fn().mockResolvedValue(null),
}));

describe("HealthController", () => {
  let healthCheckServiceMock: HealthCheckService;
  let jsonRpcHealthIndicatorMock: JsonRpcHealthIndicator;
  let configServiceMock: ConfigService;
  let healthController: HealthController;

  beforeEach(async () => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(1),
    });
    healthCheckServiceMock = mock<HealthCheckService>({
      check: jest.fn().mockImplementation((healthChecks) => {
        for (const healthCheck of healthChecks) {
          healthCheck();
        }
      }),
    });
    jsonRpcHealthIndicatorMock = mock<JsonRpcHealthIndicator>();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthCheckServiceMock,
        },
        {
          provide: JsonRpcHealthIndicator,
          useValue: jsonRpcHealthIndicatorMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    app.useLogger(mock<Logger>());

    healthController = app.get<HealthController>(HealthController);
  });

  describe("check", () => {
    it("checks health of the JSON RPC provider", async () => {
      await healthController.check();
      expect(jsonRpcHealthIndicatorMock.isHealthy).toHaveBeenCalledTimes(1);
      expect(jsonRpcHealthIndicatorMock.isHealthy).toHaveBeenCalledWith("jsonRpcProvider");
    });

    it("returns the overall check status", async () => {
      const healthCheckResult = mock<HealthCheckResult>({ status: "ok" });
      jest.spyOn(healthCheckServiceMock, "check").mockResolvedValueOnce(healthCheckResult);
      const result = await healthController.check();
      expect(result).toBe(healthCheckResult);
    });

    describe("when health checks fail with an error", () => {
      const error: ServiceUnavailableException = new ServiceUnavailableException({
        status: "error",
        rpc: {
          status: "down",
        },
      });

      beforeEach(() => {
        jest.spyOn(healthCheckServiceMock, "check").mockImplementation(() => {
          throw error;
        });
      });

      it("throws generated error", async () => {
        expect.assertions(4);
        try {
          await healthController.check();
        } catch (e) {
          expect(e).toBeInstanceOf(ServiceUnavailableException);
          expect(e.message).toBe("Service Unavailable Exception");
          expect(e.response).toEqual(error.getResponse());
          expect(e.stack).toEqual(error.stack);
        }
      });
    });
  });

  describe("beforeApplicationShutdown", () => {
    beforeEach(() => {
      (setTimeout as jest.Mock).mockReset();
    });

    it("defined and returns void", async () => {
      const result = await healthController.beforeApplicationShutdown();
      expect(result).toBeUndefined();
    });

    it("awaits configured shutdown timeout", async () => {
      await healthController.beforeApplicationShutdown("SIGTERM");
      expect(setTimeout).toBeCalledTimes(1);
      expect(setTimeout).toBeCalledWith(1);
    });

    it("does not await shutdown timeout if signal is not SIGTERM", async () => {
      await healthController.beforeApplicationShutdown("SIGINT");
      expect(setTimeout).toBeCalledTimes(0);
    });
  });
});
