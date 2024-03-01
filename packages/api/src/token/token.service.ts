import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, MoreThanOrEqual } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { IPaginationOptions } from "../common/types";
import { paginate } from "../common/utils";
import { Token, baseToken } from "./token.entity";
import { NATIVE_TOKEN_L2_ADDRESS } from "../common/constants";

export interface FilterTokensOptions {
  minLiquidity?: number;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>
  ) {}

  public async findOne(address: string, fields?: FindOptionsSelect<Token>): Promise<Token> {
    const token = await this.tokenRepository.findOne({
      where: {
        l2Address: address,
      },
      select: fields,
    });
    if (!token && address.toLowerCase() === NATIVE_TOKEN_L2_ADDRESS.toLowerCase()) {
      return (await baseToken()) as Token;
    }
    return token;
  }

  public async exists(address: string): Promise<boolean> {
    const tokenExists =
      (await this.tokenRepository.findOne({ where: { l2Address: address }, select: { l2Address: true } })) != null;
    if (!tokenExists && address === NATIVE_TOKEN_L2_ADDRESS.toLowerCase()) {
      return true;
    }
    return tokenExists;
  }

  public async findAll(
    { minLiquidity }: FilterTokensOptions,
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Token>> {
    const queryBuilder = this.tokenRepository.createQueryBuilder("token");
    if (minLiquidity >= 0) {
      queryBuilder.where({
        liquidity: MoreThanOrEqual(minLiquidity),
      });
    }
    queryBuilder.orderBy("token.liquidity", "DESC", "NULLS LAST");
    queryBuilder.addOrderBy("token.blockNumber", "DESC");
    queryBuilder.addOrderBy("token.logIndex", "DESC");
    return await paginate<Token>(queryBuilder, paginationOptions);
  }
}
