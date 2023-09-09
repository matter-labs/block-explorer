import { Logger } from "@nestjs/common";
import { IsNull, Not } from "typeorm";
import { getBatchState } from "./batch.utils";
import { unixTimeToDate } from "../utils/date";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BatchRepository, BlockRepository } from "../repositories";
import { BatchState } from "../entities/batch.entity";

export class BatchProcessor {
  private lastProcessedBatchNumber: number = null;
  private readonly logger: Logger;

  public constructor(
    private readonly state: BatchState,
    private readonly blockchainService: BlockchainService,
    private readonly batchRepository: BatchRepository,
    private readonly blockRepository: BlockRepository
  ) {
    this.logger = new Logger(BatchProcessor.name);
  }

  public async getLastProcessedBatchNumber() {
    const lastProcessedBatch = await this.batchRepository.getLastBatch(
      {
        ...(this.state === BatchState.Executed && {
          executedAt: Not(IsNull()),
        }),
        ...(this.state === BatchState.Proven && {
          provenAt: Not(IsNull()),
        }),
        ...(this.state === BatchState.Committed && {
          committedAt: Not(IsNull()),
        }),
      },
      { number: true }
    );
    return lastProcessedBatch?.number ?? -1;
  }

  public async processNextBatch(): Promise<boolean> {
    try {
      if (this.lastProcessedBatchNumber === null) {
        this.lastProcessedBatchNumber = await this.getLastProcessedBatchNumber();
      }

      const nextBatchNumber = this.lastProcessedBatchNumber + 1;
      this.logger.log({
        message: "Getting batch from the blockchain",
        batchNumber: nextBatchNumber,
        currentBatchState: this.state,
      });
      const nextBatch = await this.blockchainService.getL1BatchDetails(nextBatchNumber);
      if (!nextBatch) {
        this.logger.debug({ message: "No batch found yet", batchNumber: nextBatchNumber });
        this.lastProcessedBatchNumber = null;
        return false;
      }

      const nextBatchState = getBatchState(nextBatch);
      if (nextBatchState !== this.state) {
        this.logger.debug({
          message: "Next batch state is different to the current batch state",
          batchNumber: nextBatchNumber,
          batchState: nextBatchState,
          currentBatchState: this.state,
        });
        this.lastProcessedBatchNumber = null;
        return false;
      }

      const lastDbBlockInBatch = await this.blockRepository.getLastBlock({
        where: { l1BatchNumber: nextBatch.number },
        select: { number: true, hash: true },
      });
      if (!lastDbBlockInBatch) {
        this.lastProcessedBatchNumber = null;
        // Prevent updating or inserting batch if there are no blocks fo this batch in DB.
        // If batch is inserted or updated before at least 1 block,
        // then there is a risk it can be reverted in blockchain and we won't detect it (in case blocks are added later after revert).
        return false;
      }
      const lastDbBlockInBatchFromBlockchain = await this.blockchainService.getBlock(lastDbBlockInBatch.number);
      if (!lastDbBlockInBatchFromBlockchain || lastDbBlockInBatchFromBlockchain.hash !== lastDbBlockInBatch.hash) {
        this.lastProcessedBatchNumber = null;
        // Prevent updating or inserting batch if the last block of this batch in DB has to be reverted (block hash doesn't match).

        // If batch is inserted or updated in this case and it is executed,
        // then later on revert processing we won't revert the batch and it's blocks as executed batches are not picked up for revert.

        // If the last DB block hash in batch matches we can insert or update the batch,
        // because even if it is executed and even if not all it's blocks are in DB,
        // this means all the next blocks of this batch are already executed as well and can't be reverted.

        // If batch is not executed and part of it's blocks are reverted later,
        // the batch revert will be either detected and handled or batch will update itself on status update.
        // Revert will not be detected in this case only if blocks that are not yet in DB are reverted in blockchain,
        // but batch will update itself on the next status update.
        return false;
      }

      this.logger.debug({ message: "Adding batch to the DB", batchNumber: nextBatchNumber });
      await this.batchRepository.upsert({
        ...nextBatch,
        timestamp: unixTimeToDate(nextBatch.timestamp),
      });

      this.lastProcessedBatchNumber = nextBatchNumber;
      return true;
    } catch (error) {
      this.logger.error({
        message: "Error while processing next batch",
        stack: error.stack,
        batchNumber: this.lastProcessedBatchNumber ? this.lastProcessedBatchNumber + 1 : null,
      });
      this.lastProcessedBatchNumber = null;
      return false;
    }
  }

  public resetState() {
    this.lastProcessedBatchNumber = null;
  }
}
