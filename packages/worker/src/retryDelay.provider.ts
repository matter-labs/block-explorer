import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RetryDelayProvider {
  private static maxDelay: number = 1000 * 60 * 10;
  private static delayFactor = 2;
  private readonly delay: number;
  private retries = 0;

  constructor(configService: ConfigService) {
    this.delay = configService.get<number>("blocks.waitForBlocksInterval");
  }

  public getRetryDelay(): number {
    return Math.min(this.delay * Math.pow(RetryDelayProvider.delayFactor, this.retries++), RetryDelayProvider.maxDelay);
  }

  public resetRetryDelay(): void {
    this.retries = 0;
  }
}
