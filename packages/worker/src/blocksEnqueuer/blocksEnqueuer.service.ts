import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MoreThanOrEqual, LessThanOrEqual, Between, FindOptionsWhere } from "typeorm";
import { BlockchainService } from "../blockchain";
import { BlockRepository, BlockQueueRepository } from "../repositories";
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
    private readonly blockchainService: BlockchainService,
    private readonly blockRepository: BlockRepository,
    private readonly blockQueueRepository: BlockQueueRepository,
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
    const lastDbBlock = await this.blockRepository.getBlock({
      where: this.buildBlockRangeCondition(),
      select: { number: true },
    });
    const lastDbBlockNumber = lastDbBlock?.number ?? -1;
    const lastQueuedBlockNumber = (await this.blockQueueRepository.getLastBlockNumber()) ?? -1;
    const nextToEnqueue = Math.max(lastDbBlockNumber, lastQueuedBlockNumber) + 1;

    const fromBlockNumber = Math.max(nextToEnqueue, this.fromBlock ?? 0);
    const chainTip = await this.blockchainService.getBlockNumber();
    const cap = lastDbBlockNumber + this.maxBlocksAheadOfLastReadyBlock;
    const toBlockNumber = Math.min(chainTip, cap, this.toBlock ?? Number.MAX_SAFE_INTEGER);

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
