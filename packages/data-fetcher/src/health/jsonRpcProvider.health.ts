import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";
import { JsonRpcProviderBase } from "../rpcProvider";

@Injectable()
export class JsonRpcHealthIndicator extends HealthIndicator {
  constructor(private readonly provider: JsonRpcProviderBase) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const rpcProviderState = this.provider.getState();
    const isHealthy = rpcProviderState === "open";
    const result = this.getStatus(key, isHealthy, { rpcProviderState });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError("JSON RPC provider is not in open state", result);
  }
}
