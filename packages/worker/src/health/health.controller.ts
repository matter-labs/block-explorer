import { Logger, Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck, HealthCheckResult } from "@nestjs/terminus";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";

@Controller(["health", "ready"])
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

  @Get()
  @HealthCheck()
  public async check(): Promise<HealthCheckResult> {
    try {
      return await this.healthCheckService.check([
        () => this.dbHealthChecker.pingCheck("database", { timeout: this.dbHealthCheckTimeoutMs }),
        () => this.jsonRpcHealthIndicator.isHealthy("jsonRpcProvider"),
      ]);
    } catch (error) {
      this.logger.error({ message: error.message, response: error.getResponse() }, error.stack);
      throw error;
    }
  }
}
