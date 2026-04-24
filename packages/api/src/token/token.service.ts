import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { IPaginationOptions } from "../common/types";
import { paginate } from "../common/utils";
import { Token } from "./token.entity";
import { BASE_TOKEN_L2_ADDRESS } from "../common/constants";
import { baseToken } from "../config";
import { IndexerStateService } from "../indexerState/indexerState.service";

export interface FilterTokensOptions {
  minLiquidity?: number;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly indexerStateService: IndexerStateService
  ) {}

  public async findOne(address: string, fields?: FindOptionsSelect<Token>): Promise<Token> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const token = await this.tokenRepository.findOne({
      where: {
        l2Address: address,
        blockNumber: LessThanOrEqual(lastReadyBlockNumber),
      },
      select: fields,
    });
    if (!token && address.toLowerCase() === BASE_TOKEN_L2_ADDRESS.toLowerCase()) {
      return baseToken as Token;
    }
    return token;
  }

  public async exists(address: string): Promise<boolean> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const tokenExists =
      (await this.tokenRepository.findOne({
        where: { l2Address: address, blockNumber: LessThanOrEqual(lastReadyBlockNumber) },
        select: { l2Address: true },
      })) != null;
    if (!tokenExists && address === BASE_TOKEN_L2_ADDRESS.toLowerCase()) {
      return true;
    }
    return tokenExists;
  }

  public async findAll(
    { minLiquidity }: FilterTokensOptions,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Token>> {
    const lastReadyBlockNumber = await this.indexerStateService.getLastReadyBlockNumber();
    const queryBuilder = this.tokenRepository.createQueryBuilder("token");
    queryBuilder.where("token.blockNumber <= :lastReadyBlockNumber", { lastReadyBlockNumber });
    if (minLiquidity >= 0) {
      queryBuilder.andWhere({
        liquidity: MoreThanOrEqual(minLiquidity),
      });
    }
    queryBuilder.orderBy("token.liquidity", "DESC", "NULLS LAST");
    queryBuilder.addOrderBy("token.blockNumber", "DESC");
    queryBuilder.addOrderBy("token.logIndex", "DESC");
    return await paginate<Token>({ queryBuilder, options: paginationOptions });
  }
}
