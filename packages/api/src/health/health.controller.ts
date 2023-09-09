import { Controller, Get } from "@nestjs/common";
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck, HealthCheckResult } from "@nestjs/terminus";
import { ApiExcludeController } from "@nestjs/swagger";

@ApiExcludeController()
@Controller(["health", "ready"])
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly dbHealthChecker: TypeOrmHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  public async check(): Promise<HealthCheckResult> {
    return await this.healthCheckService.check([() => this.dbHealthChecker.pingCheck("database")]);
  }
}
