import { Injectable } from "@nestjs/common";
import { FindOptionsWhere, FindOptionsSelect } from "typeorm";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { Batch } from "../entities";

@Injectable()
export class BatchRepository extends BaseRepository<Batch> {
  public constructor(unitOfWork: UnitOfWork) {
    super(Batch, unitOfWork);
  }

  public async getLastBatch(
    findOptions: FindOptionsWhere<Batch> = {},
    select?: FindOptionsSelect<Batch>
  ): Promise<Batch> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const batch = await transactionManager.findOne(Batch, {
      where: findOptions,
      select,
      order: { number: "DESC" },
    });
    return batch;
  }
}
