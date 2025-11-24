import { Injectable, Logger } from "@nestjs/common";
import { MoreThan } from "typeorm";
import { Histogram } from "prom-client";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { UnitOfWork } from "../unitOfWork";
import { BlockStatus } from "../entities";
import { BlockRepository } from "../repositories";
import { BlockchainService } from "../blockchain";
import { CounterService } from "../counter";
import { BLOCKS_REVERT_DURATION_METRIC_NAME, BLOCKS_REVERT_DETECT_METRIC_NAME } from "../metrics";

@Injectable()
export class BlocksRevertService {
  private readonly logger: Logger;

  public constructor(
    private readonly blockchainService: BlockchainService,
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
      const lastExecutedBlock = await this.blockRepository.getBlock({
        where: {
          status: BlockStatus.Executed,
        },
        select: {
          number: true,
        },
      });
      const lastCorrectBlockNumber = await this.findLastCorrectBlockNumber(
        lastExecutedBlock?.number || 0,
        detectedIncorrectBlockNumber
      );

      const dbTransaction = this.unitOfWork.useTransaction(async () => {
        this.logger.log("Reverting counters", { lastCorrectBlockNumber });
        await this.counterService.revert(lastCorrectBlockNumber);

        this.logger.log("Reverting blocks", { lastCorrectBlockNumber });
        await this.blockRepository.delete({ number: MoreThan(lastCorrectBlockNumber) });
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
    // binary search the last block with matching hash between latest executed block from DB and incorrect block detected
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
    const blockFromDB = await this.blockRepository.getBlock({
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
