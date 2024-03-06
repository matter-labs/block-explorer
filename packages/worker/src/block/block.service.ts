import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RetryDelayProvider } from "../retryDelay.provider";
import waitFor from "../utils/waitFor";
import { Worker } from "../common/worker";
import { BlockProcessor } from "./block.processor";

@Injectable()
export class BlockService extends Worker {
  private readonly logger: Logger;
  private readonly waitForBlocksInterval: number;

  public constructor(
    private readonly blockProcessor: BlockProcessor,
    private readonly retryDelayProvider: RetryDelayProvider,
    configService: ConfigService
  ) {
    super();
    this.waitForBlocksInterval = configService.get<number>("blocks.waitForBlocksInterval");
    this.logger = new Logger(BlockService.name);
  }

  protected async runProcess(): Promise<void> {
    let nextIterationDelay = 0;
    try {
      const isNextBlockRangeProcessed = await this.blockProcessor.processNextBlocksRange();
      if (!isNextBlockRangeProcessed) {
        nextIterationDelay = this.waitForBlocksInterval;
      }
      this.retryDelayProvider.resetRetryDelay();
    } catch (error) {
      nextIterationDelay = this.retryDelayProvider.getRetryDelay();
      this.logger.error(`Error on processing next block range, waiting ${nextIterationDelay} ms to retry`, error.stack);
    }
    if (nextIterationDelay) {
      this.logger.debug(`Waiting for ${nextIterationDelay}ms`);
      await waitFor(() => !this.currentProcessPromise, nextIterationDelay);
    }
    if (!this.currentProcessPromise) {
      return;
    }
    return this.runProcess();
  }
}
