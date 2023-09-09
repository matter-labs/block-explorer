import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BatchWorker } from "./batch.worker";
import { BatchProcessor } from "./batch.processor";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BatchRepository, BlockRepository } from "../repositories";
import { BatchState } from "../entities/batch.entity";

@Injectable()
export class BatchService {
  private readonly batchWorkers: BatchWorker[];

  public constructor(
    blockchainService: BlockchainService,
    batchRepository: BatchRepository,
    blockRepository: BlockRepository,
    configService: ConfigService
  ) {
    this.batchWorkers = [BatchState.Executed, BatchState.Proven, BatchState.Committed, BatchState.New].map(
      (batchState) =>
        new BatchWorker(
          new BatchProcessor(batchState, blockchainService, batchRepository, blockRepository),
          configService.get<number>("batches.batchesProcessingPollingInterval")
        )
    );
  }

  public async start() {
    await Promise.all(this.batchWorkers.map((batchWorker) => batchWorker.start()));
  }

  public async stop() {
    await Promise.all(this.batchWorkers.map((batchWorker) => batchWorker.stop()));
  }
}
