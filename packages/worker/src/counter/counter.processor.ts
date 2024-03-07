import { Logger } from "@nestjs/common";
import {
  Repository,
  MoreThan,
  MoreThanOrEqual,
  Between,
  EntityTarget,
  getMetadataArgsStorage,
  FindOptionsWhere,
  FindOptionsOrder,
} from "typeorm";
import { UnitOfWork } from "../unitOfWork";
import { CounterRepository } from "../repositories";
import { CountableEntity } from "../entities";
import { calculateCounters } from "./counter.utils";
import { CounterCriteria } from "./counter.types";

export class CounterProcessor<T extends CountableEntity> {
  private lastProcessedRecordNumber: number = null;
  private fieldsToSelect: Array<keyof T>;
  private readonly tableName: string;
  private readonly logger: Logger;

  public constructor(
    private readonly entityClass: EntityTarget<T>,
    private readonly criteriaList: Array<CounterCriteria<T>>,
    private readonly recordsBatchSize: number,
    private readonly unitOfWork: UnitOfWork,
    private readonly repository: Repository<T>,
    private readonly counterRepository: CounterRepository
  ) {
    this.tableName = this.getTableNameForEntity(this.entityClass);
    this.fieldsToSelect = this.getFieldsToSelect();
    this.logger = new Logger(CounterProcessor.name);
  }

  public async processNextRecordsBatch(): Promise<boolean> {
    try {
      if (this.lastProcessedRecordNumber === null) {
        this.lastProcessedRecordNumber = await this.counterRepository.getLastProcessedRecordNumber(this.tableName);
      }
      this.logger.log(this.getLogMessage("Getting next records from the DB to update counters"));

      const records = await this.repository.find({
        where: {
          number: MoreThanOrEqual(this.lastProcessedRecordNumber + 1),
        } as FindOptionsWhere<T>,
        select: this.fieldsToSelect,
        take: this.recordsBatchSize,
        order: {
          number: "ASC",
        } as FindOptionsOrder<T>,
      });

      if (!records.length) {
        this.logger.debug(this.getLogMessage("No new records found yet for counters update"));
        return false;
      }

      this.logger.debug(this.getLogMessage("Updating counters"));
      const counters = calculateCounters(this.tableName, records, this.criteriaList);
      const newLastProcessedRecordNumber = Number(records[records.length - 1].number);

      const dbTransaction = this.unitOfWork.useTransaction(() =>
        this.counterRepository.incrementCounters(counters, newLastProcessedRecordNumber)
      );
      await dbTransaction.waitForExecution();

      this.lastProcessedRecordNumber = newLastProcessedRecordNumber;
      return records.length === this.recordsBatchSize;
    } catch (error) {
      this.logger.error(this.getLogMessage("Error while processing next records to update counters", error.stack));
      this.lastProcessedRecordNumber = null;
      return false;
    }
  }

  public async revert(lastCorrectBlockNumber: number): Promise<void> {
    const lastProcessedRecordNumber = await this.counterRepository.getLastProcessedRecordNumber(this.tableName);
    let lastRevertedRecordNumber = -1;
    let records = [];

    do {
      if (lastProcessedRecordNumber <= lastRevertedRecordNumber) {
        return;
      }

      records = await this.repository.find({
        where: {
          blockNumber: MoreThan(lastCorrectBlockNumber),
          number: Between(lastRevertedRecordNumber + 1, lastProcessedRecordNumber),
        } as FindOptionsWhere<T>,
        select: this.fieldsToSelect,
        take: this.recordsBatchSize,
        order: {
          number: "ASC",
        } as FindOptionsOrder<T>,
      });

      if (!records.length) {
        return;
      }

      this.logger.debug({
        message: "Reverting counters",
        tableName: this.tableName,
        startingFromNumber: Number(records[0].number),
      });
      const counters = calculateCounters(this.tableName, records, this.criteriaList);
      await this.counterRepository.decrementCounters(counters);

      lastRevertedRecordNumber = Number(records[records.length - 1].number);
    } while (records.length === this.recordsBatchSize);
  }

  private getLogMessage(message: string, stack?: string) {
    return {
      message,
      tableName: this.tableName,
      startingFromNumber: this.lastProcessedRecordNumber ? this.lastProcessedRecordNumber + 1 : null,
      ...(stack && { stack }),
    };
  }

  private getTableNameForEntity(entityClass: EntityTarget<T>): string {
    const table = getMetadataArgsStorage().tables.find((t) => t.target === entityClass);
    return table.name;
  }

  private getFieldsToSelect() {
    return [
      ...Object.keys(
        this.criteriaList.flat().reduce((acc, criteria) => {
          const fields = criteria.split("|");
          for (const field of fields) {
            acc[field] = true;
          }
          return acc;
        }, {})
      ),
      "number",
    ] as Array<keyof T>;
  }
}
