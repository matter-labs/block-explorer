import { Injectable } from "@nestjs/common";
import { Repository, FindOptionsWhere, FindOptionsOrder, FindOptionsRelations } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { paginate } from "../common/utils";
import { IPaginationOptions } from "../common/types";
import { Block } from "./block.entity";
import { BlockDetails } from "./blockDetails.entity";

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
    private readonly blockDetailsRepository: Repository<BlockDetails>
  ) {}

  private getBlock(filterOptions: FindOptionsWhere<Block>, orderOptions: FindOptionsOrder<Block>): Promise<Block> {
    return this.blocksRepository.findOne({
      where: filterOptions,
      order: orderOptions,
      select: { number: true },
    });
  }

  public async getLastBlockNumber(): Promise<number> {
    const lastBlock = await this.getBlock({}, { number: "DESC" });
    return lastBlock?.number || 0;
  }

  public async getLastVerifiedBlockNumber(): Promise<number> {
    const queryBuilder = this.blocksRepository.createQueryBuilder("block");
    queryBuilder.select("block.number");
    queryBuilder.innerJoin("block.batch", "batches");
    queryBuilder.where("batches.executedAt IS NOT NULL");
    queryBuilder.orderBy("block.number", "DESC");
    queryBuilder.limit(1);

    const lastBlock = await queryBuilder.getOne();
    return lastBlock?.number || 0;
  }

  public async findOne(
    number: number,
    selectFields?: (keyof BlockDetails)[],
    relations: FindOptionsRelations<BlockDetails> = { batch: true }
  ): Promise<BlockDetails> {
    return await this.blockDetailsRepository.findOne({
      where: { number },
      relations: relations,
      select: selectFields,
    });
  }

  public async getBlockNumber(
    filterOptions: FindOptionsWhere<Block>,
    orderOptions: FindOptionsOrder<Block>
  ): Promise<number | undefined> {
    const block = await this.getBlock(filterOptions, orderOptions);
    return block?.number;
  }

  private async count(filterOptions: FindOptionsWhere<Block>): Promise<number> {
    const [lastBlock, firstBlock] = await Promise.all([
      this.getBlock(filterOptions, { number: "DESC" }),
      this.getBlock(filterOptions, { number: "ASC" }),
    ]);
    return lastBlock?.number ? lastBlock.number - firstBlock.number + 1 : 0;
  }

  public async findAll(
    filterOptions: FindOptionsWhere<Block>,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Block>> {
    const queryBuilder = this.blocksRepository
      .createQueryBuilder("block")
      .leftJoin("block.batch", "batches")
      .addSelect("batches.executedAt")
      .where(filterOptions)
      .orderBy("block.number", "DESC");

    return await paginate<Block>(queryBuilder, paginationOptions, () => this.count(filterOptions));
  }

  public async findMany({ miner, page = 1, offset = 10, selectFields }: FindManyOptions): Promise<BlockDetails[]> {
    const queryBuilder = this.blockDetailsRepository.createQueryBuilder("block");
    queryBuilder.addSelect(selectFields);
    if (miner) {
      queryBuilder.where({
        miner,
      });
    }
    queryBuilder.offset((page - 1) * offset);
    queryBuilder.limit(offset);
    queryBuilder.orderBy("block.number", "DESC");
    return await queryBuilder.getMany();
  }
}
