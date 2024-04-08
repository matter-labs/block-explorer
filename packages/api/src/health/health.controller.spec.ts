import { Test, TestingModule } from "@nestjs/testing";
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheckResult } from "@nestjs/terminus";
import { mock } from "jest-mock-extended";
import { ConfigService } from "@nestjs/config";
import { setTimeout } from "node:timers/promises";
import { HealthController } from "./health.controller";

jest.mock("node:timers/promises", () => ({
  setTimeout: jest.fn().mockResolvedValue(null),
}));

describe("HealthController", () => {
  let healthCheckServiceMock: HealthCheckService;
  let dbHealthCheckerMock: TypeOrmHealthIndicator;
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

    dbHealthCheckerMock = mock<TypeOrmHealthIndicator>();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthCheckServiceMock,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: dbHealthCheckerMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe("check", () => {
    it("checks health of the DB", async () => {
      await healthController.check();
      expect(dbHealthCheckerMock.pingCheck).toHaveBeenCalledTimes(1);
      expect(dbHealthCheckerMock.pingCheck).toHaveBeenCalledWith("database");
    });

    it("returns the overall check status", async () => {
      const healthCheckResult = mock<HealthCheckResult>({ status: "ok" });
      (healthCheckServiceMock.check as jest.Mock).mockResolvedValueOnce(healthCheckResult);
      const result = await healthController.check();
      expect(result).toBe(healthCheckResult);
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
