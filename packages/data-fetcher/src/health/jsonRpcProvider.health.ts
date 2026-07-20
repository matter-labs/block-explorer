import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from "axios";

@Injectable()
export class JsonRpcHealthIndicator extends HealthIndicator {
  private readonly rpcUrl: string;
  private readonly healthCheckTimeoutMs: number;
  private readonly logger: Logger;

  constructor(configService: ConfigService, private readonly httpService: HttpService) {
    super();
    this.logger = new Logger(JsonRpcHealthIndicator.name);
    this.rpcUrl = configService.get<string>("blockchain.rpcUrl");
    this.healthCheckTimeoutMs = configService.get<number>("healthChecks.rpcHealthCheckTimeoutMs");
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    let isHealthy = true;
    try {
      // Check RPC health with a pure HTTP request to remove SDK out of the picture
      // and avoid any SDK-specific issues.
      // Use eth_chainId call as it is the lightest one and return a static value from the memory.
      await firstValueFrom(
        this.httpService
          .post(
            this.rpcUrl,
            {
              id: 1,
              jsonrpc: "2.0",
              method: "eth_chainId",
              params: [],
            },
            { timeout: this.healthCheckTimeoutMs }
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error({
                message: `Failed to ping RPC`,
                stack: error.stack,
                status: error.response?.status,
                response: error.response?.data,
              });
              throw error;
            })
          )
      );
    } catch {
      isHealthy = false;
    }

    const result = this.getStatus(key, isHealthy, { status: isHealthy ? "up" : "down" });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError("JSON RPC provider is down or not reachable", result);
  }
}
