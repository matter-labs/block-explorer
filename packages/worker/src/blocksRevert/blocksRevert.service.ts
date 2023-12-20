import { Injectable, Logger } from "@nestjs/common";
import { MoreThan } from "typeorm";
import { Histogram } from "prom-client";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { UnitOfWork } from "../unitOfWork";
import { BatchRepository, BlockRepository } from "../repositories";
import { BlockchainService } from "../blockchain";
import { CounterService } from "../counter";
import { BLOCKS_REVERT_DURATION_METRIC_NAME, BLOCKS_REVERT_DETECT_METRIC_NAME } from "../metrics";

@Injectable()
export class BlocksRevertService {
  private readonly logger: Logger;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly batchRepository: BatchRepository,
    private readonly blockRepository: BlockRepository,
    private readonly counterService: CounterService,
    private readonly unitOfWork: UnitOfWork,
    @InjectMetric(BLOCKS_REVERT_DURATION_METRIC_NAME)
    private readonly revertDurationMetric: Histogram,
    @InjectMetric(BLOCKS_REVERT_DETECT_METRIC_NAME)
    private readonly revertDetectMetric: Histogram
  ) {
    this.logger = new Logger(BlocksRevertService.name);
  }

  public async handleRevert(detectedIncorrectBlockNumber: number): Promise<void> {
    const stopRevertDurationMetric = this.revertDurationMetric.startTimer();
    const stopRevertDetectMetric = this.revertDetectMetric.startTimer();
    stopRevertDetectMetric();

    try {
      const lastExecutedBlockNumber = await this.blockRepository.getLastExecutedBlockNumber();
      const lastCorrectBlockNumber = await this.findLastCorrectBlockNumber(
        lastExecutedBlockNumber,
        detectedIncorrectBlockNumber
      );

      const lastCorrectBlock = await this.blockRepository.getLastBlock({
        where: { number: lastCorrectBlockNumber },
        select: { number: true, l1BatchNumber: true },
        relations: {
          batch: true,
        },
      });
      // If the last correct block is in the middle of the batch it's possible that this batch might need a revert,
      // e.g. revert happened in blockchain for the 2-nd half of blocks for the batch.
      let lastCorrectBatchNumber = lastCorrectBlock.l1BatchNumber;
      if (lastCorrectBlock.batch) {
        const batchFromBlockchain = await this.blockchainService.getL1BatchDetails(lastCorrectBlock.l1BatchNumber);
        // Check if batch of the last correct block has to be reverted, if so - decrement last correct batch number.
        if (!batchFromBlockchain || lastCorrectBlock.batch.rootHash !== batchFromBlockchain.rootHash) {
          lastCorrectBatchNumber -= 1;
        }
      }

      const dbTransaction = this.unitOfWork.useTransaction(async () => {
        this.logger.log("Reverting counters", { lastCorrectBlockNumber });
        await this.counterService.revert(lastCorrectBlockNumber);

        this.logger.log("Reverting batches and blocks", { lastCorrectBlockNumber, lastCorrectBatchNumber });
        await Promise.all([
          this.batchRepository.delete({ number: MoreThan(lastCorrectBatchNumber) }),
          this.blockRepository.delete({ number: MoreThan(lastCorrectBlockNumber) }),
        ]);
      });
      await dbTransaction.waitForExecution();

      this.logger.log("Blocks revert completed", { lastCorrectBlockNumber });
    } catch (error) {
      this.logger.error("Blocks revert failed", { detectedIncorrectBlockNumber, error: error.stack });
      throw error;
    } finally {
      stopRevertDurationMetric();
    }
  }

  private findLastCorrectBlockNumber = async (
    lastExecutedBlockNumber: number,
    detectedIncorrectBlockNumber: number
  ) => {
    // binary search the last block with matching hash between latest executed block from DB and incorrect clock detected
    let start = lastExecutedBlockNumber;
    let end = detectedIncorrectBlockNumber;

    while (end > start + 1) {
      const mid = Math.floor((start + end) / 2);
      const conditionMet = await this.isHashMatch(mid);
      if (conditionMet) {
        start = mid;
      } else {
        end = mid;
      }
    }
    return start;
  };

  private async isHashMatch(blockNumber: number) {
    const blockFromDB = await this.blockRepository.getLastBlock({
      where: { number: blockNumber },
      select: { hash: true },
    });
    const blockFromBlockchain = await this.blockchainService.getBlock(blockNumber);
    if (blockFromDB.hash === blockFromBlockchain?.hash) {
      return true;
    }
    return false;
  }
}
