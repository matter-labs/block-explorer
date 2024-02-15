import { Logger, Controller, Get, OnApplicationShutdown } from "@nestjs/common";
import { HealthCheckService, HealthCheck, HealthCheckResult } from "@nestjs/terminus";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";

@Controller(["health", "ready"])
export class HealthController implements OnApplicationShutdown {
  private readonly logger: Logger;

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly jsonRpcHealthIndicator: JsonRpcHealthIndicator
  ) {
    this.logger = new Logger(HealthController.name);
  }

  @Get()
  @HealthCheck()
  public async check(): Promise<HealthCheckResult> {
    try {
      const healthCheckResult = await this.healthCheckService.check([
        () => this.jsonRpcHealthIndicator.isHealthy("jsonRpcProvider"),
      ]);
      this.logger.debug({ message: "Health check result", ...healthCheckResult });
      return healthCheckResult;
    } catch (error) {
      this.logger.error({ message: error.message, response: error.getResponse() }, error.stack);
      throw error;
    }
  }

  onApplicationShutdown(signal?: string): void {
    this.logger.debug({ message: "Received a signal", signal });
  }
}
