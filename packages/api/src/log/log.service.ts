import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { IPaginationOptions } from "../common/types";
import { paginate } from "../common/utils";
import { Log } from "./log.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { VisibleLog } from "./visibleLog.entity";

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
    private readonly configService: ConfigService
  ) {}

  public async findAll(
    filterOptions: FilterLogsOptions = {},
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Log>> {
    const disableTxVisibilityByTopics = this.configService.get<boolean>("prividium.disableTxVisibilityByTopics");
    const { visibleBy, ...basicFilters } = filterOptions;

    if (visibleBy && !disableTxVisibilityByTopics) {
      const qb = this.visibleLogRepository.createQueryBuilder("visibleLog");
      qb.select("visibleLog.number");
      qb.leftJoinAndSelect("visibleLog.log", "log");
      qb.where({ visibleBy, ...basicFilters });
      qb.orderBy("visibleLog.timestamp", "DESC");
      qb.addOrderBy("visibleLog.logIndex", "ASC");
      const result = await paginate<VisibleLog>(qb, paginationOptions);
      return { ...result, items: result.items.map((vl) => vl.log) };
    }

    const queryBuilder = this.logRepository.createQueryBuilder("log");
    queryBuilder.where(basicFilters);

    if (visibleBy) {
      queryBuilder.andWhere({ transactionFrom: visibleBy });
    }

    queryBuilder.orderBy("log.timestamp", "DESC");
    queryBuilder.addOrderBy("log.logIndex", "ASC");
    return await paginate<Log>(queryBuilder, paginationOptions);
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
    const queryBuilder = this.logRepository.createQueryBuilder("log");
    queryBuilder.leftJoin("log.transaction", "transaction");
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transaction.gasPrice", "transactionReceipt.gasUsed"]);

    if (address !== undefined) {
      queryBuilder.andWhere({ address });
    }
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
    if (topics.topic0 !== undefined) {
      queryBuilder.andWhere("log.topics[1] = :topic0", { topic0: hexTransformer.to(topics.topic0) });
    }
    if (topics.topic1 !== undefined) {
      queryBuilder.andWhere("log.topics[2] = :topic1", { topic1: hexTransformer.to(topics.topic1) });
    }
    if (topics.topic2 !== undefined) {
      queryBuilder.andWhere("log.topics[3] = :topic2", { topic2: hexTransformer.to(topics.topic2) });
    }
    if (topics.topic3 !== undefined) {
      queryBuilder.andWhere("log.topics[4] = :topic3", { topic3: hexTransformer.to(topics.topic3) });
    }

    queryBuilder.offset((page - 1) * offset);
    queryBuilder.limit(offset);
    queryBuilder.orderBy("log.blockNumber", order);
    queryBuilder.addOrderBy("log.logIndex", order);
    return await queryBuilder.getMany();
  }
}
