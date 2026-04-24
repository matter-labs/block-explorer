import { Injectable } from "@nestjs/common";
import { Repository, FindOptionsWhere, FindOptionsOrder } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { paginate } from "../common/utils";
import { IPaginationOptions } from "../common/types";
import { Block, BlockStatus } from "./block.entity";
import { BlockDetails } from "./blockDetails.entity";
import { IndexerStateService } from "../indexerState/indexerState.service";

export interface FindManyOptions {
  miner?: string;
  page?: number;
  offset?: number;
  selectFields?: (keyof BlockDetails)[];
}

@Injectable()
export class BlockService {
  public constructor(
    @InjectRepository(Block)
    private readonly blocksRepository: Repository<Block>,
    @InjectRepository(BlockDetails)
    private readonly blockDetailsRepository: Repository<BlockDetails>,
    private readonly indexerStateService: IndexerStateService
  ) {}

  private getBlock(filterOptions: FindOptionsWhere<Block>, orderOptions: FindOptionsOrder<Block>): Promise<Block> {
    return this.blocksRepository.findOne({
      where: filterOptions,
      order: orderOptions,
      select: { number: true },
    });
  }

  public async getLastBlockNumber(): Promise<number> {
    return await this.indexerStateService.getLastReadyBlockNumber();
  }

  public async getLastVerifiedBlockNumber(): Promise<number> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const queryBuilder = this.blocksRepository.createQueryBuilder("block");
    queryBuilder.select("block.number");
    queryBuilder.where("block.status = :status", { status: BlockStatus.Executed });
    queryBuilder.andWhere("block.number <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    queryBuilder.orderBy("block.number", "DESC");
    queryBuilder.limit(1);

    const lastBlock = await queryBuilder.getOne();
    return lastBlock?.number || 0;
  }

  public async findOne(number: number, selectFields?: (keyof BlockDetails)[]): Promise<BlockDetails> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    if (number > lastReadyBlockNumber) {
      return null;
    }
    return await this.blockDetailsRepository.findOne({
      where: { number },
      select: selectFields,
    });
  }

  public async getBlockNumber(
    filterOptions: FindOptionsWhere<Block>,
    orderOptions: FindOptionsOrder<Block>
  ): Promise<number | undefined> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const block = await this.getBlock(filterOptions, orderOptions);
    if (block?.number > lastReadyBlockNumber) {
      return undefined;
    }
    return block?.number;
  }

  private async count(filterOptions: FindOptionsWhere<Block>): Promise<number> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const [lastBlock, firstBlock] = await Promise.all([
      this.getBlock(filterOptions, { number: "DESC" }),
      this.getBlock(filterOptions, { number: "ASC" }),
    ]);
    if (!lastBlock) {
      return 0;
    }
    const upperBound = Math.min(lastBlock.number, lastReadyBlockNumber);
    if (upperBound < firstBlock.number) {
      return 0;
    }
    return upperBound - firstBlock.number + 1;
  }

  public async findAll(
    filterOptions: FindOptionsWhere<Block>,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Block>> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const queryBuilder = this.blocksRepository
      .createQueryBuilder("block")
      .where(filterOptions)
      .andWhere("block.number <= :lastReadyBlockNumber", { lastReadyBlockNumber })
      .orderBy("block.number", "DESC");

    return await paginate<Block>({
      queryBuilder,
      options: paginationOptions,
      countQuery: () => this.count(filterOptions),
    });
  }

  public async findMany({ miner, page = 1, offset = 10, selectFields }: FindManyOptions): Promise<BlockDetails[]> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const queryBuilder = this.blockDetailsRepository.createQueryBuilder("block");
    queryBuilder.addSelect(selectFields);
    queryBuilder.where("block.number <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    if (miner) {
      queryBuilder.andWhere({ miner });
    }
    queryBuilder.offset((page - 1) * offset);
    queryBuilder.limit(offset);
    queryBuilder.orderBy("block.number", "DESC");
    return await queryBuilder.getMany();
  }
}
