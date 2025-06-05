import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { IPaginationOptions } from "../common/types";
import { paginate } from "../common/utils";
import { Log } from "./log.entity";

export interface FilterLogsOptions {
  transactionHash?: string;
  address?: string;
}

export interface FilterLogsByAddressOptions {
  address: string;
  fromBlock?: number;
  toBlock?: number;
  page?: number;
  offset?: number;
}

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>
  ) {}

  public async findAll(
    filterOptions: FilterLogsOptions = {},
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Log>> {
    const queryBuilder = this.logRepository.createQueryBuilder("log");
    queryBuilder.where(filterOptions);
    queryBuilder.orderBy("log.timestamp", "DESC");
    queryBuilder.addOrderBy("log.logIndex", "ASC");
    return await paginate<Log>(queryBuilder, paginationOptions);
  }

  public async findMany({
    address,
    fromBlock,
    toBlock,
    page = 1,
    offset = 10,
  }: FilterLogsByAddressOptions): Promise<Log[]> {
    const queryBuilder = this.logRepository.createQueryBuilder("log");
    queryBuilder.leftJoin("log.transaction", "transaction");
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transaction.gasPrice", "transactionReceipt.gasUsed"]);
    queryBuilder.where({ address });
    if (fromBlock !== undefined) {
      queryBuilder.andWhere({
        blockNumber: MoreThanOrEqual(fromBlock),
      });
    }
    if (toBlock !== undefined) {
      queryBuilder.andWhere({
        blockNumber: LessThanOrEqual(toBlock),
      });
    }

    queryBuilder.offset((page - 1) * offset);
    queryBuilder.limit(offset);
    queryBuilder.orderBy("log.blockNumber", "ASC");
    queryBuilder.addOrderBy("log.logIndex", "ASC");
    return await queryBuilder.getMany();
  }
}
