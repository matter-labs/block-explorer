import { Injectable } from "@nestjs/common";
import { Repository, FindOptionsWhere } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { paginate } from "../common/utils";
import { IPaginationOptions } from "../common/types";
import { Batch } from "./batch.entity";
import { BatchDetails } from "./batchDetails.entity";

@Injectable()
export class BatchService {
  public constructor(
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(BatchDetails)
    private readonly batchDetailsRepository: Repository<BatchDetails>
  ) {}

  private getLastBatch(filterOptions: FindOptionsWhere<Batch>): Promise<Batch> {
    return this.batchRepository.findOne({
      where: filterOptions,
      order: { number: "DESC" },
      select: ["number"],
    });
  }

  private getFirstBatch(filterOptions: FindOptionsWhere<Batch>): Promise<Batch> {
    return this.batchRepository.findOne({
      where: filterOptions,
      order: { number: "ASC" },
      select: ["number"],
    });
  }

  public async getLastBatchNumber(filterOptions: FindOptionsWhere<Batch> = {}): Promise<number> {
    const lastBatch = await this.getLastBatch(filterOptions);
    return lastBatch?.number || 0;
  }

  public findOne(number: number): Promise<BatchDetails> {
    return this.batchDetailsRepository.findOneBy({ number });
  }

  private async count(filterOptions: FindOptionsWhere<Batch>): Promise<number> {
    const [lastBatch, firstBatch] = await Promise.all([
      this.getLastBatch(filterOptions),
      this.getFirstBatch(filterOptions),
    ]);
    return lastBatch?.number ? lastBatch.number - firstBatch.number + 1 : 0;
  }

  public findAll(
    filterOptions: FindOptionsWhere<Batch>,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Batch>> {
    const queryBuilder = this.batchRepository
      .createQueryBuilder("batch")
      .where(filterOptions)
      .orderBy("batch.number", "DESC");

    return paginate<Batch>(queryBuilder, paginationOptions, () => this.count(filterOptions));
  }
}
