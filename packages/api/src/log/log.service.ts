import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { IPaginationOptions } from "../common/types";
import { paginate } from "../common/utils";
import { Log } from "./log.entity";

export interface FilterLogsOptions {
  transactionHash?: string;
  address?: string;
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
}
