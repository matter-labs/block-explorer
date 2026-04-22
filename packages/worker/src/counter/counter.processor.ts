import { Logger } from "@nestjs/common";
import { Repository, EntityTarget, getMetadataArgsStorage } from "typeorm";
import { UnitOfWork } from "../unitOfWork";
import { CounterRepository, IndexerStateRepository } from "../repositories";
import { CountableEntity } from "../entities";
import { calculateCounters } from "./counter.utils";
import { CounterCriteria } from "./counter.types";

export class CounterProcessor<T extends CountableEntity> {
  private lastProcessedRecordNumber: number = null;
  private lastProcessedBlockNumber: number = null;
  private fieldsToSelect: Array<keyof T>;
  private readonly tableName: string;
  private readonly logger: Logger;

  public constructor(
    private readonly entityClass: EntityTarget<T>,
    private readonly criteriaList: Array<CounterCriteria<T>>,
    private readonly recordsBatchSize: number,
    private readonly unitOfWork: UnitOfWork,
    private readonly repository: Repository<T>,
    private readonly counterRepository: CounterRepository,
    private readonly indexerStateRepository: IndexerStateRepository
  ) {
    this.tableName = this.getTableNameForEntity(this.entityClass);
    this.fieldsToSelect = this.getFieldsToSelect();
    this.logger = new Logger(CounterProcessor.name);
  }

  public async processNextRecordsBatch(): Promise<boolean> {
    try {
      if (this.lastProcessedRecordNumber === null || this.lastProcessedBlockNumber === null) {
        const cursor = await this.counterRepository.getLastProcessedCursor(this.tableName);
        this.lastProcessedRecordNumber = cursor.lastProcessedRecordNumber;
        this.lastProcessedBlockNumber = cursor.lastProcessedBlockNumber;
      }
      this.logger.log(this.getLogMessage("Getting next records from the DB to update counters"));

      const lastReadyBlockNumber = await this.indexerStateRepository.getLastReadyBlockNumber();
      const records = await this.repository
        .createQueryBuilder("record")
        .select(this.fieldsToSelect.map((f) => `record.${String(f)}`))
        .where(`(record."blockNumber", record."number") > (:lastBlockNumber, :lastRecordNumber)`, {
          lastBlockNumber: this.lastProcessedBlockNumber,
          lastRecordNumber: this.lastProcessedRecordNumber,
        })
        .andWhere(`record."blockNumber" <= :lastReadyBlockNumber`, { lastReadyBlockNumber })
        .orderBy(`record."blockNumber"`, "ASC")
        .addOrderBy(`record."number"`, "ASC")
        .limit(this.recordsBatchSize)
        .getMany();

      if (!records.length) {
        this.logger.debug(this.getLogMessage("No new records found yet for counters update"));
        return false;
      }

      this.logger.debug(this.getLogMessage("Updating counters"));
      const counters = calculateCounters(this.tableName, records, this.criteriaList);
      const newLastProcessedRecordNumber = Number(records[records.length - 1].number);
      const newLastProcessedBlockNumber = Number(records[records.length - 1].blockNumber);

      const dbTransaction = this.unitOfWork.useTransaction(() =>
        this.counterRepository.incrementCounters(counters, newLastProcessedRecordNumber, newLastProcessedBlockNumber)
      );
      await dbTransaction.waitForExecution();

      this.lastProcessedRecordNumber = newLastProcessedRecordNumber;
      this.lastProcessedBlockNumber = newLastProcessedBlockNumber;
      return records.length === this.recordsBatchSize;
    } catch (error) {
      this.logger.error(this.getLogMessage("Error while processing next records to update counters", error.stack));
      this.lastProcessedRecordNumber = null;
      this.lastProcessedBlockNumber = null;
      return false;
    }
  }

  public async revert(lastCorrectBlockNumber: number): Promise<void> {
    try {
      const cursor = await this.counterRepository.getLastProcessedCursor(this.tableName);
      this.lastProcessedRecordNumber = cursor.lastProcessedRecordNumber;
      this.lastProcessedBlockNumber = cursor.lastProcessedBlockNumber;

      let records = [];
      do {
        records = await this.repository
          .createQueryBuilder("record")
          .select(this.fieldsToSelect.map((f) => `record.${String(f)}`))
          .where(`(record."blockNumber", record."number") <= (:lastBlockNumber, :lastRecordNumber)`, {
            lastBlockNumber: this.lastProcessedBlockNumber,
            lastRecordNumber: this.lastProcessedRecordNumber,
          })
          .andWhere(`record."blockNumber" > :lastCorrectBlockNumber`, { lastCorrectBlockNumber })
          .orderBy(`record."blockNumber"`, "DESC")
          .addOrderBy(`record."number"`, "DESC")
          .limit(this.recordsBatchSize)
          .getMany();

        if (!records.length) {
          break;
        }

        this.logger.debug({
          message: "Reverting counters",
          tableName: this.tableName,
          startingFromNumber: Number(records[0].number),
          startingFromBlockNumber: Number(records[0].blockNumber),
          endingAtNumber: Number(records[records.length - 1].number),
          endingAtBlockNumber: Number(records[records.length - 1].blockNumber),
        });
        const last = records[records.length - 1];
        const newLastProcessedBlockNumber = Number(last.blockNumber);
        const newLastProcessedRecordNumber = Number(last.number) - 1;
        const counters = calculateCounters(this.tableName, records, this.criteriaList);
        await this.counterRepository.decrementCounters(
          counters,
          newLastProcessedRecordNumber,
          newLastProcessedBlockNumber
        );

        this.lastProcessedRecordNumber = newLastProcessedRecordNumber;
        this.lastProcessedBlockNumber = newLastProcessedBlockNumber;
      } while (records.length === this.recordsBatchSize);
    } finally {
      // Invalidate in-memory cursor: outer transaction may still roll back after this returns.
      this.lastProcessedRecordNumber = null;
      this.lastProcessedBlockNumber = null;
    }
  }

  private getLogMessage(message: string, stack?: string) {
    return {
      message,
      tableName: this.tableName,
      startingFromNumber: this.lastProcessedRecordNumber != null ? this.lastProcessedRecordNumber + 1 : null,
      startingFromBlockNumber: this.lastProcessedBlockNumber != null ? this.lastProcessedBlockNumber + 1 : null,
      ...(stack && { stack }),
    };
  }

  private getTableNameForEntity(entityClass: EntityTarget<T>): string {
    const table = getMetadataArgsStorage().tables.find((t) => t.target === entityClass);
    return table.name;
  }

  private getFieldsToSelect() {
    const fields = this.criteriaList.flat().reduce((acc, criteria) => {
      for (const field of criteria.split("|")) {
        acc[field] = true;
      }
      return acc;
    }, {});
    fields["number"] = true;
    fields["blockNumber"] = true;
    return Object.keys(fields) as Array<keyof T>;
  }
}
