import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Gauge } from "prom-client";
import { DataSource, Driver } from "typeorm";
import { DB_CONNECTION_POOL_SIZE_METRIC_NAME, DbConnectionPoolSizeMetricLabels } from "./metrics";

type ConnectionPoolInfo = {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
};

export type PostgresDriver = Driver & {
  master: ConnectionPoolInfo;
};

@Injectable()
export class DbMetricsService implements OnModuleInit, OnModuleDestroy {
  private collectDbConnectionPoolMetricsInterval: number;
  private collectDbConnectionPoolMetricsTimer: NodeJS.Timer = null;

  constructor(
    @InjectMetric(DB_CONNECTION_POOL_SIZE_METRIC_NAME)
    private readonly dbConnectionPoolSizeMetric: Gauge<DbConnectionPoolSizeMetricLabels>,
    private readonly dataSource: DataSource,
    configService: ConfigService
  ) {
    this.collectDbConnectionPoolMetricsInterval = configService.get<number>(
      "metrics.collectDbConnectionPoolMetricsInterval"
    );
  }

  public onModuleInit() {
    this.collectDbConnectionPoolMetricsTimer = setInterval(() => {
      const { master } = this.dataSource.driver as PostgresDriver;

      this.dbConnectionPoolSizeMetric.labels({ pool: "master", type: "total" }).set(master.totalCount);
      this.dbConnectionPoolSizeMetric.labels({ pool: "master", type: "idle" }).set(master.idleCount);
      this.dbConnectionPoolSizeMetric.labels({ pool: "master", type: "waiting" }).set(master.waitingCount);
    }, this.collectDbConnectionPoolMetricsInterval);
  }

  public onModuleDestroy() {
    clearInterval(this.collectDbConnectionPoolMetricsTimer as unknown as number);
  }
}
