import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "../common/worker";
import waitFor from "../utils/waitFor";
import { getTableNameForEntity } from "../utils/db";
import { CounterRepository, IndexerStateRepository, MonthlyActiveAddressRepository } from "../repositories";
import { MonthlyActiveAddress } from "../entities";

@Injectable()
export class MonthlyActiveAddressCounterWorker extends Worker {
  private readonly logger: Logger;
  private readonly tableName: string;
  private readonly recordsBatchSize: number;
  private readonly pollingInterval: number;

  public constructor(
    private readonly monthlyActiveAddressRepository: MonthlyActiveAddressRepository,
    private readonly counterRepository: CounterRepository,
    private readonly indexerStateRepository: IndexerStateRepository,
    configService: ConfigService
  ) {
    super();
    this.logger = new Logger(MonthlyActiveAddressCounterWorker.name);
    this.tableName = getTableNameForEntity(MonthlyActiveAddress);
    this.recordsBatchSize = configService.get<number>("counters.recordsBatchSize");
    this.pollingInterval = configService.get<number>("counters.updateInterval");
  }

  protected async runProcess(): Promise<void> {
    do {
      const hasMore = await this.processNextRecordsBatch();
      if (!hasMore) {
        await waitFor(() => !this.currentProcessPromise, this.pollingInterval);
      }
    } while (this.currentProcessPromise);
  }

  public revert(lastCorrectBlockNumber: number): Promise<void> {
    return this.monthlyActiveAddressRepository.revertAboveBlockNumber(lastCorrectBlockNumber, this.tableName);
  }

  private async processNextRecordsBatch(): Promise<boolean> {
    try {
      const cursor = await this.counterRepository.getLastProcessedCursor(this.tableName);
      const lastReadyBlockNumber = await this.indexerStateRepository.getLastReadyBlockNumber();

      const result = await this.monthlyActiveAddressRepository.processTransactionsBatch(
        { lastBlockNumber: cursor.lastProcessedBlockNumber, lastRecordNumber: cursor.lastProcessedRecordNumber },
        lastReadyBlockNumber,
        this.recordsBatchSize,
        this.tableName
      );
      this.logger.debug({
        message: "Processed monthly active addresses batch",
        processed: result.processed,
        newLastBlockNumber: result.newLastBlockNumber,
        newLastRecordNumber: result.newLastRecordNumber,
      });

      return result.processed === this.recordsBatchSize;
    } catch (error) {
      this.logger.error("Error while processing monthly active addresses batch", (error as Error).stack);
      return false;
    }
  }
}
