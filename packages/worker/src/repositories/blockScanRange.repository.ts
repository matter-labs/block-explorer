import { Injectable } from "@nestjs/common";
import { FindOptionsWhere, FindOptionsSelect, FindOptionsRelations } from "typeorm";
import { UnitOfWork } from "../unitOfWork";
import {BlockScanRange} from "../entities/blockScanRange.entity";

@Injectable()
export class BlockScanRangeRepository {
  public constructor(private readonly unitOfWork: UnitOfWork) {}

  public async getLastScanToBlock({
    where = {},
    select,
    relations,
  }: {
    where?: FindOptionsWhere<BlockScanRange>;
    select?: FindOptionsSelect<BlockScanRange>;
    relations?: FindOptionsRelations<BlockScanRange>;
  } = {}): Promise<BlockScanRange> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    return await transactionManager.findOne<BlockScanRange>(BlockScanRange, {
      where,
      select,
      order: { id: "DESC" },
      relations,
    });
  }

  public async add(from: number,to: number): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.insert<BlockScanRange>(BlockScanRange, {
      from,to
    });
  }
}
