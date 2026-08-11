import { Logger, Controller, Get, BeforeApplicationShutdown } from "@nestjs/common";
import { HealthCheckService, HealthCheck, HealthCheckResult, HealthIndicatorFunction } from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { setTimeout } from "node:timers/promises";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";

@Controller()
export class HealthController implements BeforeApplicationShutdown {
  private readonly logger: Logger;
  private readonly gracefulShutdownTimeoutMs: number;

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly jsonRpcHealthIndicator: JsonRpcHealthIndicator,
    configService: ConfigService
  ) {
    this.logger = new Logger(HealthController.name);
    this.gracefulShutdownTimeoutMs = configService.get<number>("gracefulShutdownTimeoutMs");
  }

  @Get("health")
  @HealthCheck()
  public async checkLiveness(): Promise<HealthCheckResult> {
    return await this.check([() => this.jsonRpcHealthIndicator.isAlive("jsonRpcProvider")]);
  }

  @Get("ready")
  @HealthCheck()
  public async checkReadiness(): Promise<HealthCheckResult> {
    return await this.check([() => this.jsonRpcHealthIndicator.isHealthy("jsonRpcProvider")]);
  }

  private async check(indicators: HealthIndicatorFunction[]): Promise<HealthCheckResult> {
    try {
      return await this.healthCheckService.check(indicators);
    } catch (error) {
      this.logger.error({ message: error.message, response: error.getResponse() }, error.stack);
      throw error;
    }
  }

  public async beforeApplicationShutdown(signal?: string): Promise<void> {
    if (this.gracefulShutdownTimeoutMs && signal === "SIGTERM") {
      this.logger.debug(`Awaiting ${this.gracefulShutdownTimeoutMs}ms before shutdown`);
      await setTimeout(this.gracefulShutdownTimeoutMs);
      this.logger.debug(`Timeout reached, shutting down now`);
    }
  }
}
