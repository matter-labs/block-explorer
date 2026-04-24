import { Injectable } from "@nestjs/common";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { CounterStateRepository } from "./counterState.repository";
import { Counter } from "../entities";

@Injectable()
export class CounterRepository extends BaseRepository<Counter> {
  public constructor(unitOfWork: UnitOfWork, private readonly counterStateRepository: CounterStateRepository) {
    super(Counter, unitOfWork);
  }

  public async getLastProcessedCursor(
    tableName: string
  ): Promise<{ lastProcessedRecordNumber: number; lastProcessedBlockNumber: number }> {
    const counterState = await this.counterStateRepository.findOneBy({
      tableName,
    });
    return {
      lastProcessedRecordNumber: counterState ? counterState.lastProcessedRecordNumber : -1,
      lastProcessedBlockNumber: counterState ? counterState.lastProcessedBlockNumber : -1,
    };
  }

  public async getLastProcessedRecordNumber(tableName: string) {
    const counterState = await this.counterStateRepository.findOneBy({
      tableName,
    });
    return counterState ? counterState.lastProcessedRecordNumber : -1;
  }

  public async incrementCounters(
    counters: QueryDeepPartialEntity<Counter>[],
    lastProcessedRecordNumber: number,
    lastProcessedBlockNumber: number
  ): Promise<void> {
    const incrementCounterTasks = counters.map((counter) => this.insertOrIncrement(counter));
    const updateCounterStateTask = this.counterStateRepository.upsert(
      {
        tableName: counters[0].tableName,
        lastProcessedRecordNumber,
        lastProcessedBlockNumber,
      },
      false,
      ["tableName"]
    );

    await Promise.all([...incrementCounterTasks, updateCounterStateTask]);
  }

  public async decrementCounters(
    counters: Partial<Counter>[],
    lastProcessedRecordNumber: number,
    lastProcessedBlockNumber: number
  ): Promise<void> {
    const decrementTasks = counters.map((counter) => this.decrement(counter));
    const updateStateTask = this.counterStateRepository.upsert(
      {
        tableName: counters[0].tableName,
        lastProcessedRecordNumber,
        lastProcessedBlockNumber,
      },
      false,
      ["tableName"]
    );
    await Promise.all([...decrementTasks, updateStateTask]);
  }

  private async insertOrIncrement(counter: QueryDeepPartialEntity<Counter>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager
      .createQueryBuilder()
      .insert()
      .into(this.entityTarget)
      .values(counter)
      // Cannot use orUpdate here as it doesn't support updating value based on previous value, there is a github issue for that.
      // onConflict might become not deprecated again (based on github issues).
      // If onConflict is removed replace the entire query with raw SQL query.
      .onConflict(`("tableName", "queryString") DO UPDATE SET "count" = counters.count + EXCLUDED.count`)
      .execute();
  }

  private async decrement(counter: Partial<Counter>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.decrement(
      this.entityTarget,
      { tableName: counter.tableName, queryString: counter.queryString },
      "count",
      counter.count
    );
  }
}
