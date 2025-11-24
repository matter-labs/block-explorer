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
