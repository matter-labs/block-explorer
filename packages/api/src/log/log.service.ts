import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { IPaginationOptions } from "../common/types";
import { paginate } from "../common/utils";
import { Log } from "./log.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { OWNERSHIP_TRANSFERRED_TOPIC } from "../common/constants";

export interface FilterLogsOptions {
  transactionHash?: string;
  address?: string;
  someLogMatch?: string;
}

export interface FilterLogsByAddressOptions {
  address: string;
  fromBlock?: number;
  toBlock?: number;
  page?: number;
  offset?: number;
}

export interface FilterLogsByTopicsOptions {
  address?: string;
  topics: {
    topic0?: string;
    topic1?: string;
    topic2?: string;
    topic3?: string;
  };
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
    const { someLogMatch, ...baseFilters } = filterOptions;
    const queryBuilder = this.logRepository.createQueryBuilder("log");
    queryBuilder.where(baseFilters);
    queryBuilder.orderBy("log.timestamp", "DESC");
    queryBuilder.addOrderBy("log.logIndex", "ASC");

    let params = {};
    if (someLogMatch) {
      params = { addr: hexTransformer.to(someLogMatch) };

      queryBuilder.where(
        new Brackets((qb) => {
          qb.where(`log.topics[1] = :addr`);
          qb.orWhere("log.topics[2] = :addr");
          qb.orWhere("log.topics[3] = :addr");
        })
      );
    }
    queryBuilder.setParameters(params);

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

  public async findManyByTopics({
    address,
    topics,
    fromBlock,
    toBlock,
    page = 1,
    offset = 10,
  }: FilterLogsByTopicsOptions): Promise<Log[]> {
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
    queryBuilder.orderBy("log.timestamp", "DESC");
    return await queryBuilder.getMany();
  }

  // Returns address padded to 32 bytes;
  async findContractOwnerTopic(address: string): Promise<string | null> {
    const [log] = await this.findManyByTopics({
      address: address,
      topics: {
        topic0: OWNERSHIP_TRANSFERRED_TOPIC,
      },
      page: 1,
      offset: 1,
    });

    if (!log) {
      return null;
    }

    const topic = log.topics[2];

    if (!topic) {
      return null;
    }

    return topic;
  }
}
