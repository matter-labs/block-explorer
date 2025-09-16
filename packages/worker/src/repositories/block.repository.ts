import { Injectable } from "@nestjs/common";
import { FindOptionsWhere, FindOptionsSelect, FindOptionsRelations } from "typeorm";
import { Block } from "../entities";
import { UnitOfWork } from "../unitOfWork";

@Injectable()
export class BlockRepository {
  public constructor(private readonly unitOfWork: UnitOfWork) {}

  public async getLastBlock({
    where = {},
    select,
    relations,
  }: {
    where?: FindOptionsWhere<Block>;
    select?: FindOptionsSelect<Block>;
    relations?: FindOptionsRelations<Block>;
  } = {}): Promise<Block> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return await transactionManager.findOne<Block>(Block, {
      where,
      select,
      order: { number: "DESC" },
      relations,
    });
  }

  public async getLastExecutedBlockNumber(): Promise<number> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const lastExecutedBlock = await transactionManager
      .createQueryBuilder(Block, "block")
      .select("block.number")
      .innerJoin("block.batch", "batch")
      .where("batch.executedAt IS NOT NULL")
      .orderBy("block.number", "DESC")
      .limit(1)
      .getOne();
    return lastExecutedBlock?.number || 0;
  }

  public async getMissingBlocksCount(): Promise<number> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const { count } = await transactionManager
      .createQueryBuilder(Block, "block")
      .select("MAX(number) - COUNT(number) + 1 AS count") // +1 for the block #0
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
}
