import { Injectable } from "@nestjs/common";
import { FindOptionsWhere, FindOptionsSelect, FindOptionsRelations } from "typeorm";
import { types } from "zksync-ethers";
import { Block as BlockDto } from "../dataFetcher/types";
import { unixTimeToDate } from "../utils/date";
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

  public async add(blockDto: BlockDto, blockDetailsDto: types.BlockDetails): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.insert<Block>(Block, {
      ...blockDto,
      ...blockDetailsDto,
      timestamp: unixTimeToDate(blockDetailsDto.timestamp),
    });
  }

  public async delete(where: FindOptionsWhere<Block>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.delete<Block>(Block, where);
  }
}
