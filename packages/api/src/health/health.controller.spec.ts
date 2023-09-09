import { Test, TestingModule } from "@nestjs/testing";
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheckResult } from "@nestjs/terminus";
import { mock } from "jest-mock-extended";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let healthCheckServiceMock: HealthCheckService;
  let dbHealthCheckerMock: TypeOrmHealthIndicator;
  let healthController: HealthController;

  beforeEach(async () => {
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
});
