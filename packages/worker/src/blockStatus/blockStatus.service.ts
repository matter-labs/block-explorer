import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LessThan } from "typeorm";
import { BlockchainService } from "../blockchain";
import { BlockRepository, IndexerStateRepository } from "../repositories";
import { BlockStatus } from "../entities";
import waitFor from "../utils/waitFor";
import { Worker } from "../common/worker";

@Injectable()
export class BlockStatusService extends Worker {
  private readonly logger: Logger;
  private readonly pollingInterval: number;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly blockRepository: BlockRepository,
    private readonly indexerStateRepository: IndexerStateRepository,
    configService: ConfigService
  ) {
    super();
    this.pollingInterval = configService.get<number>("blocks.statusCheckPollingInterval");
    this.logger = new Logger(BlockStatusService.name);
  }

  protected async runProcess(): Promise<void> {
    try {
      await this.updateBlocksStatus("finalized");
      await this.updateBlocksStatus("safe");
    } catch (error) {
      this.logger.error({
        message: "Error while updating blocks status",
        stack: error.stack,
      });
    }
    await waitFor(() => !this.currentProcessPromise, this.pollingInterval);
    if (!this.currentProcessPromise) {
      return;
    }
    return this.runProcess();
  }

  private async updateBlocksStatus(status: "safe" | "finalized"): Promise<void> {
    const latestBlockByStatus = await this.blockchainService.getBlock(status);
    if (!latestBlockByStatus) {
      return;
    }

    const lastReadyBlockNumber = await this.indexerStateRepository.getLastReadyBlockNumber();
    if (!lastReadyBlockNumber) {
      return;
    }
    const lastReadyBlock = await this.blockRepository.getBlock({
      where: { number: lastReadyBlockNumber },
      select: { number: true, hash: true },
    });
    if (!lastReadyBlock) {
      return;
    }
    const lastBlockFromBlockchain = await this.blockchainService.getBlock(lastReadyBlockNumber);
    if (!lastBlockFromBlockchain) {
      return;
    }
    if (lastReadyBlock.hash !== lastBlockFromBlockchain.hash) {
      this.logger.warn(`Skipping block status update: last ready block hash mismatch (reorg detected)`);
      return;
    }

    const blockStatus = status === "safe" ? BlockStatus.Committed : BlockStatus.Executed;
    const firstDbBlockWithSmallerStatus = await this.blockRepository.getBlock({
      where: {
        status: LessThan(blockStatus),
      },
      select: {
        number: true,
      },
      order: {
        number: "ASC",
      },
    });
    if (!firstDbBlockWithSmallerStatus) {
      return;
    }
    const updateFrom = firstDbBlockWithSmallerStatus.number;
    const updateTo = Math.min(latestBlockByStatus.number, lastReadyBlockNumber);
    if (updateFrom > updateTo) {
      return;
    }
    this.logger.debug(`Updating blocks with status = ${blockStatus} from ${updateFrom} to ${updateTo}`);
    await this.blockRepository.updateByRange(updateFrom, updateTo, { status: blockStatus });
  }
}
