import { Injectable, Inject, Provider, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RetryDelayProvider } from "../retryDelay.provider";
import { BlocksIndexerProcessor } from "./blocksIndexer.processor";
import { BlocksIndexerWorker } from "./blocksIndexer.worker";

export const BLOCKS_INDEXER_WORKERS_TOKEN = "BlocksIndexerWorkers";

export const BlocksIndexerWorkersProvider: Provider<BlocksIndexerWorker[]> = {
  provide: BLOCKS_INDEXER_WORKERS_TOKEN,
  inject: [ConfigService, BlocksIndexerProcessor, RetryDelayProvider],
  useFactory: (
    configService: ConfigService,
    blocksIndexerProcessor: BlocksIndexerProcessor,
    retryDelayProvider: RetryDelayProvider
  ) => {
    const poolSize = configService.get<number>("blocks.blocksProcessingWorkerPoolSize");
    return Array.from(
      { length: poolSize },
      () => new BlocksIndexerWorker(blocksIndexerProcessor, retryDelayProvider, configService)
    );
  },
};

@Injectable()
export class BlocksIndexerService {
  private readonly logger: Logger;

  public constructor(
    @Inject(BLOCKS_INDEXER_WORKERS_TOKEN)
    private readonly workers: BlocksIndexerWorker[]
  ) {
    this.logger = new Logger(BlocksIndexerService.name);
  }

  public start(): Promise<void[]> {
    this.logger.log(`Starting ${this.workers.length} blocks indexer worker(s)`);
    return Promise.all(this.workers.map((w) => w.start()));
  }

  public stop(): Promise<void[]> {
    this.logger.log(`Stopping ${this.workers.length} blocks indexer worker(s)`);
    return Promise.all(this.workers.map((w) => w.stop()));
  }
}
