import { Logger, Controller, Get, BeforeApplicationShutdown } from "@nestjs/common";
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck, HealthCheckResult } from "@nestjs/terminus";
import { ApiExcludeController } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { setTimeout } from "node:timers/promises";

@ApiExcludeController()
@Controller(["health", "ready"])
export class HealthController implements BeforeApplicationShutdown {
  private readonly logger: Logger;
  private readonly gracefulShutdownTimeoutMs: number;

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly dbHealthChecker: TypeOrmHealthIndicator,
    configService: ConfigService
  ) {
    this.logger = new Logger(HealthController.name);
    this.gracefulShutdownTimeoutMs = configService.get<number>("gracefulShutdownTimeoutMs");
  }

  @Get()
  @HealthCheck()
  public async check(): Promise<HealthCheckResult> {
    return await this.healthCheckService.check([() => this.dbHealthChecker.pingCheck("database")]);
  }

  public async beforeApplicationShutdown(signal?: string): Promise<void> {
    if (this.gracefulShutdownTimeoutMs && signal === "SIGTERM") {
      this.logger.debug(`Awaiting ${this.gracefulShutdownTimeoutMs}ms before shutdown`);
      await setTimeout(this.gracefulShutdownTimeoutMs);
      this.logger.debug(`Timeout reached, shutting down now`);
    }
  }
}
