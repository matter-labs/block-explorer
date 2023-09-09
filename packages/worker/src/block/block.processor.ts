import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { MoreThanOrEqual, LessThanOrEqual, Between, FindOptionsWhere } from "typeorm";
import { UnitOfWork } from "../unitOfWork";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BlockInfo, BlockWatcher } from "./block.watcher";
import { BalanceService } from "../balance/balance.service";
import { BlockRepository } from "../repositories";
import { Block } from "../entities";
import { TransactionProcessor } from "../transaction";
import { LogProcessor } from "../log";
import { validateBlocksLinking } from "./block.utils";
import {
  BLOCKS_BATCH_PROCESSING_DURATION_METRIC_NAME,
  BLOCK_PROCESSING_DURATION_METRIC_NAME,
  BALANCES_PROCESSING_DURATION_METRIC_NAME,
  BlocksBatchProcessingMetricLabels,
  BlockProcessingMetricLabels,
} from "../metrics";
import { BLOCKS_REVERT_DETECTED_EVENT } from "../constants";

@Injectable()
export class BlockProcessor {
  private readonly logger: Logger;
  private readonly fromBlock: number;
  private readonly toBlock: number;
  private readonly disableBlocksRevert: boolean;

  public constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly blockchainService: BlockchainService,
    private readonly transactionProcessor: TransactionProcessor,
    private readonly logProcessor: LogProcessor,
    private readonly balanceService: BalanceService,
    private readonly blockWatcher: BlockWatcher,
    private readonly blockRepository: BlockRepository,
    private readonly eventEmitter: EventEmitter2,
    @InjectMetric(BLOCKS_BATCH_PROCESSING_DURATION_METRIC_NAME)
    private readonly blocksBatchProcessingDurationMetric: Histogram<BlocksBatchProcessingMetricLabels>,
    @InjectMetric(BLOCK_PROCESSING_DURATION_METRIC_NAME)
    private readonly processingDurationMetric: Histogram<BlockProcessingMetricLabels>,
    @InjectMetric(BALANCES_PROCESSING_DURATION_METRIC_NAME)
    private readonly balancesProcessingDurationMetric: Histogram,
    configService: ConfigService
  ) {
    this.logger = new Logger(BlockProcessor.name);
    this.fromBlock = configService.get<number>("blocks.fromBlock");
    this.toBlock = configService.get<number>("blocks.toBlock");
    this.disableBlocksRevert = configService.get<boolean>("blocks.disableBlocksRevert");
  }

  public async processNextBlocksRange(): Promise<boolean> {
    const lastDbBlock = await this.blockRepository.getLastBlock({
      where: this.buildBlockRangeCondition(),
      select: { number: true, hash: true },
    });
    const lastDbBlockNumber = lastDbBlock?.number;
    this.logger.debug(`Last block number stored in DB: ${lastDbBlockNumber}`);

    const blocksToProcess = await this.blockWatcher.getNextBlocksToProcess(lastDbBlockNumber);
    if (!blocksToProcess.length) {
      this.logger.debug("No more blocks to process, waiting for new blocks");
      if (!lastDbBlock) {
        return false;
      }
      const lastBlockFromBlockchain = await this.blockchainService.getBlock(lastDbBlockNumber);
      if (lastDbBlock.hash === lastBlockFromBlockchain?.hash) {
        return false;
      }
      this.triggerBlocksRevertEvent(lastDbBlockNumber);
      return false;
    }

    if (lastDbBlock && lastDbBlock.hash !== blocksToProcess[0].block?.parentHash) {
      this.triggerBlocksRevertEvent(lastDbBlockNumber);
      return false;
    }

    const allBlocksExist = !blocksToProcess.find((blockInfo) => !blockInfo.block || !blockInfo.blockDetails);
    if (!allBlocksExist) {
      // We don't need to handle this potential revert as these blocks are not in DB yet,
      // try again later once these blocks are present in blockchain again.
      this.logger.warn(
        "Not all the requested blocks from the next blocks to process range exist in blockchain, likely revert has happened",
        {
          lastDbBlockNumber,
        }
      );
      return false;
    }
    const isBlocksLinkingValid = validateBlocksLinking(blocksToProcess);
    if (!isBlocksLinkingValid) {
      // We don't need to handle this revert as these blocks are not in DB yet,
      // we just need to wait for blockchain to complete this revert before inserting these blocks.
      // This is very unlikely to ever happen.
      this.logger.warn(
        "Some of the requested blocks from the next blocks to process range have invalid link to previous block, likely revert has happened",
        {
          lastDbBlockNumber: lastDbBlockNumber,
        }
      );
      return false;
    }

    const stopDurationMeasuring = this.blocksBatchProcessingDurationMetric.startTimer();
    try {
      await this.unitOfWork.useTransaction(async () => {
        await Promise.all(blocksToProcess.map((blockInfo) => this.addBlock(blockInfo)));
      });
      stopDurationMeasuring({ status: "success" });
    } catch (error) {
      stopDurationMeasuring({ status: "error" });
      throw error;
    }

    return true;
  }

  private triggerBlocksRevertEvent(detectedIncorrectBlockNumber: number) {
    this.logger.warn("Blocks revert detected", { detectedIncorrectBlockNumber });
    if (!this.disableBlocksRevert) {
      this.eventEmitter.emit(BLOCKS_REVERT_DETECTED_EVENT, {
        detectedIncorrectBlockNumber,
      });
    }
  }

  private async addBlock({ block, blockDetails }: BlockInfo): Promise<void> {
    let blockProcessingStatus = "success";
    const blockNumber = block.number;
    this.logger.log({ message: `Adding block #${blockNumber}`, blockNumber });

    const stopDurationMeasuring = this.processingDurationMetric.startTimer();
    try {
      await this.blockRepository.add(block, blockDetails);

      await Promise.all(
        block.transactions.map((transactionHash) => this.transactionProcessor.add(transactionHash, blockDetails))
      );

      if (block.transactions.length === 0) {
        const logs = await this.blockchainService.getLogs({
          fromBlock: blockNumber,
          toBlock: blockNumber,
        });

        await this.logProcessor.process(logs, blockDetails);
      }

      const stopBalancesDurationMeasuring = this.balancesProcessingDurationMetric.startTimer();

      this.logger.debug({ message: "Updating balances", blockNumber });
      await this.balanceService.saveChangedBalances(blockNumber);

      stopBalancesDurationMeasuring();
    } catch (error) {
      blockProcessingStatus = "error";
      throw error;
    } finally {
      this.balanceService.clearTrackedState(blockNumber);
      stopDurationMeasuring({ status: blockProcessingStatus, action: "add" });
    }
  }

  private buildBlockRangeCondition = (): FindOptionsWhere<Block> => {
    return this.fromBlock && this.toBlock
      ? {
          number: Between(this.fromBlock, this.toBlock),
        }
      : {
          ...(this.fromBlock && { number: MoreThanOrEqual(this.fromBlock) }),
          ...(this.toBlock && { number: LessThanOrEqual(this.toBlock) }),
        };
  };
}
