import { Injectable } from "@nestjs/common";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { BlockQueue } from "../entities";

@Injectable()
export class BlockQueueRepository extends BaseRepository<BlockQueue> {
  public constructor(unitOfWork: UnitOfWork) {
    super(BlockQueue, unitOfWork);
  }

  public async getLastBlockNumber(): Promise<number | null> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const row = await transactionManager.findOne(BlockQueue, {
      select: { blockNumber: true },
      order: { blockNumber: "DESC" },
    });
    return row?.blockNumber ?? null;
  }

  public async enqueueRange(fromBlockNumber: number, toBlockNumber: number): Promise<void> {
    if (fromBlockNumber > toBlockNumber) {
      return;
    }
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.query(
      `INSERT INTO "blockQueue" ("blockNumber") SELECT generate_series($1::bigint, $2::bigint) ON CONFLICT ("blockNumber") DO NOTHING`,
      [fromBlockNumber, toBlockNumber]
    );
  }

  public async enqueue(blockNumbers: number[]): Promise<void> {
    if (blockNumbers.length === 0) {
      return;
    }
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager
      .createQueryBuilder()
      .insert()
      .into(BlockQueue)
      .values(blockNumbers.map((blockNumber) => ({ blockNumber })))
      .orIgnore()
      .execute();
  }

  public async claim(batchSize: number): Promise<number[]> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const rows = await transactionManager
      .createQueryBuilder(BlockQueue, "q")
      .select(`q."blockNumber"`, "blockNumber")
      .orderBy(`q."blockNumber"`, "ASC")
      .limit(batchSize)
      .setLock("pessimistic_write")
      .setOnLocked("skip_locked")
      .getRawMany<{ blockNumber: string }>();
    return rows.map((row) => Number(row.blockNumber));
  }

  public async remove(blockNumbers: number[]): Promise<void> {
    if (blockNumbers.length === 0) {
      return;
    }
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager
      .createQueryBuilder()
      .delete()
      .from(BlockQueue)
      .where(`"blockNumber" IN (:...blockNumbers)`, { blockNumbers })
      .execute();
  }
}
