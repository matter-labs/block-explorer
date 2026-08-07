import { Logger, Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheck,
  HealthCheckResult,
  HealthIndicatorFunction,
} from "@nestjs/terminus";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";

@Controller()
export class HealthController {
  private readonly logger: Logger;
  private readonly dbHealthCheckTimeoutMs: number;

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly dbHealthChecker: TypeOrmHealthIndicator,
    private readonly jsonRpcHealthIndicator: JsonRpcHealthIndicator,
    configService: ConfigService
  ) {
    this.logger = new Logger(HealthController.name);
    this.dbHealthCheckTimeoutMs = configService.get<number>("healthChecks.dbHealthCheckTimeoutMs");
  }

  @Get("health")
  @HealthCheck()
  public async checkLiveness(): Promise<HealthCheckResult> {
    return await this.check([() => this.jsonRpcHealthIndicator.isAlive("jsonRpcProvider")]);
  }

  @Get("ready")
  @HealthCheck()
  public async checkReadiness(): Promise<HealthCheckResult> {
    return await this.check([
      () => this.dbHealthChecker.pingCheck("database", { timeout: this.dbHealthCheckTimeoutMs }),
      () => this.jsonRpcHealthIndicator.isHealthy("jsonRpcProvider"),
    ]);
  }

  private async check(indicators: HealthIndicatorFunction[]): Promise<HealthCheckResult> {
    try {
      return await this.healthCheckService.check(indicators);
    } catch (error) {
      this.logger.error({ message: error.message, response: error.getResponse() }, error.stack);
      throw error;
    }
  }
}
