import { ServiceUnavailableException, Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { HealthCheckService, HealthCheckResult } from "@nestjs/terminus";
import { mock } from "jest-mock-extended";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let healthCheckServiceMock: HealthCheckService;
  let jsonRpcHealthIndicatorMock: JsonRpcHealthIndicator;
  let healthController: HealthController;

  beforeEach(async () => {
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

  describe("onApplicationShutdown", () => {
    it("defined and returns void", async () => {
      const result = healthController.onApplicationShutdown();
      expect(result).toBeUndefined();
    });
  });
});
