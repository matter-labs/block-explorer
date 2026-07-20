import { Injectable } from "@nestjs/common";
import {
  FindOptionsWhere,
  FindOptionsSelect,
  FindOptionsRelations,
  FindOptionsOrder,
  Between,
  UpdateResult,
} from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Block } from "../entities";
import { UnitOfWork } from "../unitOfWork";

@Injectable()
export class BlockRepository {
  public constructor(private readonly unitOfWork: UnitOfWork) {}

  public async getBlock({
    where = {},
    select,
    relations,
    order = { number: "DESC" },
  }: {
    where?: FindOptionsWhere<Block>;
    select?: FindOptionsSelect<Block>;
    relations?: FindOptionsRelations<Block>;
    order?: FindOptionsOrder<Block>;
  } = {}): Promise<Block> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return await transactionManager.findOne<Block>(Block, {
      where,
      select,
      order,
      relations,
    });
  }

  public async getStateAboveLastReadyBlock(
    lastReadyBlockNumber: number
  ): Promise<{ firstIncorrectBlockNumber: number | null; lastCorrectBlockNumber: number | null }> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const rows = await transactionManager.query<
      { firstIncorrectBlockNumber: string | null; lastCorrectBlockNumber: string | null }[]
    >(
      `WITH ranked AS (
        SELECT
          number,
          "parentHash",
          LAG(hash) OVER (ORDER BY number) AS prev_hash,
          LAG(number) OVER (ORDER BY number) AS prev_number
        FROM blocks
        WHERE number >= $1
      ),
      break AS (
        SELECT number, prev_number
        FROM ranked
        WHERE number > $1
          AND prev_hash IS DISTINCT FROM "parentHash"
        ORDER BY number
        LIMIT 1
      )
      SELECT
        (SELECT number FROM break) AS "firstIncorrectBlockNumber",
        COALESCE(
          (SELECT prev_number FROM break),
          (
            SELECT number
            FROM blocks
            WHERE number >= $1
            ORDER BY number DESC
            LIMIT 1
          )
        ) AS "lastCorrectBlockNumber"`,
      [lastReadyBlockNumber]
    );
    const row = rows[0];
    return {
      firstIncorrectBlockNumber: row.firstIncorrectBlockNumber == null ? null : Number(row.firstIncorrectBlockNumber),
      lastCorrectBlockNumber: row.lastCorrectBlockNumber == null ? null : Number(row.lastCorrectBlockNumber),
    };
  }

  public async getMissingBlocksCount(lastReadyBlockNumber: number): Promise<number> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const { count } = await transactionManager
      .createQueryBuilder(Block, "block")
      .select(":lastReadyBlockNumber - COUNT(number) + 1 AS count") // +1 for the block #0
      .where("block.number <= :lastReadyBlockNumber", { lastReadyBlockNumber })
      .getRawOne<{ count: number }>();
    return Number(count);
  }

  public async add(block: Partial<Block>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.insert<Block>(Block, block);
  }

  public async delete(where: FindOptionsWhere<Block>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.delete<Block>(Block, where);
  }

  public async deleteWithReturningNumber(where: FindOptionsWhere<Block>): Promise<number[]> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const result = await transactionManager
      .createQueryBuilder()
      .delete()
      .from(Block)
      .where(where)
      .returning(`"number"`)
      .execute();
    return (result.raw as { number: string }[]).map((row) => Number(row.number));
  }

  public updateByRange(from: number, to: number, fieldsToUpdate: QueryDeepPartialEntity<Block>): Promise<UpdateResult> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return transactionManager.update<Block>(
      Block,
      {
        number: Between(from, to),
      },
      fieldsToUpdate
    );
  }
}
