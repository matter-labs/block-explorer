import { Injectable } from "@nestjs/common";
import { EntityTarget, FindOptionsWhere, FindManyOptions } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { UnitOfWork } from "../unitOfWork";

const BATCH_SIZE = 1000;

@Injectable()
export abstract class BaseRepository<T> {
  public constructor(protected readonly entityTarget: EntityTarget<T>, protected readonly unitOfWork: UnitOfWork) {}

  public async addMany(records: Partial<T>[]): Promise<void> {
    if (!records?.length) {
      return;
    }

    const transactionManager = this.unitOfWork.getTransactionManager();

    let recordsToAdd = [];
    for (let i = 0; i < records.length; i++) {
      recordsToAdd.push(records[i]);
      if (recordsToAdd.length === BATCH_SIZE || i === records.length - 1) {
        await transactionManager.insert<T>(this.entityTarget, recordsToAdd);
        recordsToAdd = [];
      }
    }
  }

  public async add(record: QueryDeepPartialEntity<T>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.insert<T>(this.entityTarget, record);
  }

  // Do not use upsert for tables with auto-incremented fields, each update also increases sequence for the next insert
  public async upsert(
    record: QueryDeepPartialEntity<T>,
    shouldExcludeNullValues = true,
    conflictPaths = ["number"]
  ): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const recordToUpsert = shouldExcludeNullValues
      ? Object.keys(record).reduce((acc, key) => {
          if (record[key] !== null && record[key] !== undefined) {
            acc[key] = record[key];
          }
          return acc;
        }, {})
      : record;
    await transactionManager.upsert<T>(this.entityTarget, recordToUpsert, {
      conflictPaths,
      skipUpdateIfNoValuesChanged: true,
    });
  }

  public async delete(where: FindOptionsWhere<T>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.delete<T>(this.entityTarget, where);
  }

  public async findOneBy(where: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T | null> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return await transactionManager.findOneBy(this.entityTarget, where);
  }

  public async find(options: FindManyOptions<T>): Promise<T[]> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return await transactionManager.find(this.entityTarget, options);
  }
}
