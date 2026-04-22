import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MoreThanOrEqual, LessThanOrEqual, Between, FindOptionsWhere } from "typeorm";
import { ChainTipTracker } from "../chainTipTracker.service";
import { BlockRepository, BlockQueueRepository, IndexerStateRepository } from "../repositories";
import { Block } from "../entities";
import waitFor from "../utils/waitFor";
import { Worker } from "../common/worker";

@Injectable()
export class BlocksEnqueuerService extends Worker {
  private readonly logger: Logger;
  private readonly pollingInterval: number;
  private readonly fromBlock: number;
  private readonly toBlock: number;
  private readonly maxBlocksAheadOfLastReadyBlock: number;

  public constructor(
    private readonly chainTipTracker: ChainTipTracker,
    private readonly blockRepository: BlockRepository,
    private readonly blockQueueRepository: BlockQueueRepository,
    private readonly indexerStateRepository: IndexerStateRepository,
    configService: ConfigService
  ) {
    super();
    this.pollingInterval = configService.get<number>("blocks.enqueuerPollingInterval");
    this.fromBlock = configService.get<number>("blocks.fromBlock");
    this.toBlock = configService.get<number>("blocks.toBlock");
    this.maxBlocksAheadOfLastReadyBlock = configService.get<number>("blocks.maxBlocksAheadOfLastReadyBlock");
    this.logger = new Logger(BlocksEnqueuerService.name);
  }

  protected async runProcess(): Promise<void> {
    try {
      await this.enqueueNextBlocks();
    } catch (error) {
      this.logger.error({ message: "Error while enqueuing blocks", stack: error.stack });
    }
    await waitFor(() => !this.currentProcessPromise, this.pollingInterval);
    if (!this.currentProcessPromise) {
      return;
    }
    return this.runProcess();
  }

  private async enqueueNextBlocks(): Promise<void> {
    // Read queue first, then DB. Workers atomically insert the block and remove the
    // queue row in a single tx, so if we see the queue's "after" state we are guaranteed
    // to also see the DB's "after" state — avoiding a race where we re-enqueue a block
    // that was just committed.
    const lastQueuedBlockNumber = (await this.blockQueueRepository.getLastBlockNumber()) ?? -1;
    const [lastDbBlock, lastReadyBlockNumber] = await Promise.all([
      this.blockRepository.getBlock({
        where: this.buildBlockRangeCondition(),
        select: { number: true },
      }),
      this.indexerStateRepository.getLastReadyBlockNumber(),
    ]);
    const lastDbBlockNumber = lastDbBlock?.number ?? -1;

    // Only refill when the system (DB + queue) is less than maxBlocksAheadOfLastReadyBlock
    // ahead of the watermark. Using max(lastDb, lastQueued) captures cases where the queue
    // has been drained but DB has already moved far ahead — so if the watermark is stuck,
    // we don't keep enqueuing more work.
    const ahead = Math.max(lastDbBlockNumber, lastQueuedBlockNumber) - lastReadyBlockNumber;
    if (ahead >= this.maxBlocksAheadOfLastReadyBlock) {
      return;
    }

    const nextToEnqueue = Math.max(lastDbBlockNumber, lastQueuedBlockNumber) + 1;
    const fromBlockNumber = Math.max(nextToEnqueue, this.fromBlock ?? 0);
    const chainTip = this.chainTipTracker.getLastBlockNumber();
    if (chainTip === null) {
      return;
    }
    const batchEnd = nextToEnqueue + this.maxBlocksAheadOfLastReadyBlock - 1;
    const toBlockNumber = Math.min(chainTip, batchEnd, this.toBlock ?? Number.MAX_SAFE_INTEGER);

    if (toBlockNumber < fromBlockNumber) {
      return;
    }
    this.logger.debug(`Enqueuing blocks from ${fromBlockNumber} to ${toBlockNumber}`);
    await this.blockQueueRepository.enqueueRange(fromBlockNumber, toBlockNumber);
  }

  private buildBlockRangeCondition(): FindOptionsWhere<Block> {
    return this.fromBlock && this.toBlock
      ? { number: Between(this.fromBlock, this.toBlock) }
      : {
          ...(this.fromBlock && { number: MoreThanOrEqual(this.fromBlock) }),
          ...(this.toBlock && { number: LessThanOrEqual(this.toBlock) }),
        };
  }
}
