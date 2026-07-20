import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, LessThanOrEqual, SelectQueryBuilder } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { IPaginationOptions } from "../common/types";
import { paginate, copyOrderBy } from "../common/utils";
import { Log } from "./log.entity";
import { VisibleLog } from "./visibleLog.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { IndexerStateService } from "../indexerState/indexerState.service";

export interface FilterLogsOptions {
  transactionHash?: string;
  address?: string;
  visibleBy?: string;
}

export interface FilterLogsByAddressAndTopicsOptions {
  address?: string;
  topics?: {
    topic0?: string;
    topic1?: string;
    topic2?: string;
    topic3?: string;
  };
  fromBlock?: number;
  toBlock?: number;
  page?: number;
  offset?: number;
  order?: "ASC" | "DESC";
}

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
    @InjectRepository(VisibleLog)
    private readonly visibleLogRepository: Repository<VisibleLog>,
    private readonly configService: ConfigService,
    private readonly indexerStateService: IndexerStateService
  ) {}

  public async findAll(
    filterOptions: FilterLogsOptions = {},
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Log>> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const disableTxVisibilityByTopics = this.configService.get<boolean>("prividium.disableTxVisibilityByTopics");
    const { visibleBy, ...basicFilters } = filterOptions;
    const order = basicFilters.transactionHash ? "ASC" : "DESC";

    if (visibleBy && !disableTxVisibilityByTopics) {
      const innerQb = this.visibleLogRepository.createQueryBuilder("vl");
      innerQb.select("vl.logNumber", "logNumber");
      innerQb.where({ visibleBy, ...basicFilters });
      innerQb.andWhere("vl.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
      innerQb.orderBy("vl.blockNumber", order);
      innerQb.addOrderBy("vl.logIndex", order);

      return paginate<Log>({
        queryBuilder: innerQb as unknown as SelectQueryBuilder<Log>,
        options: paginationOptions,
        wrapQuery: async (pagedInnerQb) => {
          const outerQb = this.logRepository.createQueryBuilder("log");
          outerQb.innerJoin(`(${pagedInnerQb.getQuery()})`, "_paginated", `"_paginated"."logNumber" = "log"."number"`);
          outerQb.setParameters(pagedInnerQb.getParameters());
          copyOrderBy(pagedInnerQb, outerQb, "log");
          return outerQb;
        },
      });
    }

    const qb = this.logRepository.createQueryBuilder("log");
    qb.where({ ...basicFilters, ...(visibleBy && { transactionFrom: visibleBy }) });
    qb.andWhere("log.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    qb.orderBy("log.blockNumber", order);
    qb.addOrderBy("log.logIndex", order);
    return paginate<Log>({ queryBuilder: qb, options: paginationOptions });
  }

  public async findMany({
    address,
    topics = {},
    fromBlock,
    toBlock,
    page = 1,
    offset = 10,
    order = "DESC",
  }: FilterLogsByAddressAndTopicsOptions): Promise<Log[]> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const clampedToBlock = toBlock !== undefined ? Math.min(toBlock, lastReadyBlockNumber) : lastReadyBlockNumber;
    const innerQb = this.logRepository.createQueryBuilder("log");
    innerQb.select("log.number", "number");
    if (address !== undefined) {
      innerQb.andWhere({ address });
    }
    if (fromBlock !== undefined) {
      innerQb.andWhere({ blockNumber: MoreThanOrEqual(fromBlock) });
    }
    innerQb.andWhere({ blockNumber: LessThanOrEqual(clampedToBlock) });
    if (topics.topic0 !== undefined) {
      innerQb.andWhere("log.topics[1] = :topic0", { topic0: hexTransformer.to(topics.topic0) });
    }
    if (topics.topic1 !== undefined) {
      innerQb.andWhere("log.topics[2] = :topic1", { topic1: hexTransformer.to(topics.topic1) });
    }
    if (topics.topic2 !== undefined) {
      innerQb.andWhere("log.topics[3] = :topic2", { topic2: hexTransformer.to(topics.topic2) });
    }
    if (topics.topic3 !== undefined) {
      innerQb.andWhere("log.topics[4] = :topic3", { topic3: hexTransformer.to(topics.topic3) });
    }
    innerQb.orderBy("log.blockNumber", order);
    innerQb.addOrderBy("log.logIndex", order);
    innerQb.offset((page - 1) * offset);
    innerQb.limit(offset);

    const queryBuilder = this.logRepository.createQueryBuilder("log");
    queryBuilder.innerJoin(`(${innerQb.getQuery()})`, "_paginated", `"_paginated"."number" = "log"."number"`);
    queryBuilder.setParameters(innerQb.getParameters());
    queryBuilder.leftJoin("log.transaction", "transaction");
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transaction.gasPrice", "transactionReceipt.gasUsed"]);
    queryBuilder.orderBy("log.blockNumber", order);
    queryBuilder.addOrderBy("log.logIndex", order);
    return await queryBuilder.getMany();
  }
}
