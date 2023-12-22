import { Logger, Controller, Get } from "@nestjs/common";
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck, HealthCheckResult } from "@nestjs/terminus";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";

@Controller(["health", "ready"])
export class HealthController {
  private readonly logger: Logger;

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly dbHealthChecker: TypeOrmHealthIndicator,
    private readonly jsonRpcHealthIndicator: JsonRpcHealthIndicator
  ) {
    this.logger = new Logger(HealthController.name);
  }

  @Get()
  @HealthCheck()
  public async check(): Promise<HealthCheckResult> {
    try {
      return await this.healthCheckService.check([
        () => this.dbHealthChecker.pingCheck("database"),
        () => this.jsonRpcHealthIndicator.isHealthy("jsonRpcProvider"),
      ]);
    } catch (error) {
      this.logger.error({ message: error.message, response: error.getResponse() }, error.stack);
      throw error;
    }
  }
}
