import { mock } from "jest-mock-extended";
import { Gauge } from "prom-client";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { DbConnectionPoolSizeMetricLabels } from "./metrics";
import { DbMetricsService, PostgresDriver } from "./dbMetrics.service";

jest.useFakeTimers();

describe("DbMetricsService", () => {
  const timer = mock<NodeJS.Timer>();
  let dbConnectionPoolSizeMetricMock: Gauge<DbConnectionPoolSizeMetricLabels>;
  let dataSourceMock: DataSource;
  let configServiceMock: ConfigService;
  let dbMetricsService: DbMetricsService;

  beforeEach(() => {
    jest.spyOn(global, "setInterval").mockImplementation((callback: () => void) => {
      callback();
      return timer as unknown as NodeJS.Timeout;
    });
    jest.spyOn(global, "clearInterval");

    dbConnectionPoolSizeMetricMock = mock<Gauge<DbConnectionPoolSizeMetricLabels>>({
      labels: jest.fn().mockReturnThis(),
      set: jest.fn(),
    });
    dataSourceMock = mock<DataSource>({
      driver: mock<PostgresDriver>({
        master: {
          totalCount: 10,
          idleCount: 5,
          waitingCount: 3,
        },
      }),
    });
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(10000),
    });
    dbMetricsService = new DbMetricsService(dbConnectionPoolSizeMetricMock, dataSourceMock, configServiceMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("onModuleInit", () => {
    it("starts sending db connection pool metrics by interval", () => {
      dbMetricsService.onModuleInit();

      expect(global.setInterval).toBeCalledWith(expect.any(Function), 10000);
      expect(dbConnectionPoolSizeMetricMock.labels).toBeCalledTimes(3);
      expect(dbConnectionPoolSizeMetricMock.set).toBeCalledTimes(3);

      expect(dbConnectionPoolSizeMetricMock.labels).toBeCalledWith({ pool: "master", type: "total" });
      expect(dbConnectionPoolSizeMetricMock.labels).toBeCalledWith({ pool: "master", type: "idle" });
      expect(dbConnectionPoolSizeMetricMock.labels).toBeCalledWith({ pool: "master", type: "waiting" });
      expect(dbConnectionPoolSizeMetricMock.set).toBeCalledWith(10);
      expect(dbConnectionPoolSizeMetricMock.set).toBeCalledWith(5);
      expect(dbConnectionPoolSizeMetricMock.set).toBeCalledWith(3);
    });
  });

  describe("onModuleDestroy", () => {
    it("clears interval for metrics timer", () => {
      dbMetricsService.onModuleInit();
      dbMetricsService.onModuleDestroy();
      expect(global.clearInterval).toBeCalledWith(timer);
    });
  });
});
