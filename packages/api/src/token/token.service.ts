import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Pagination, IPaginationOptions } from "nestjs-typeorm-paginate";
import { paginate } from "../common/utils";
import { Token } from "./token.entity";

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>
  ) {}

  public async findOne(address: string): Promise<Token> {
    return await this.tokenRepository.findOneBy({ l2Address: address });
  }

  public async exists(address: string): Promise<boolean> {
    return (await this.tokenRepository.findOne({ where: { l2Address: address }, select: { l2Address: true } })) != null;
  }

  public async findAll(paginationOptions: IPaginationOptions): Promise<Pagination<Token>> {
    const queryBuilder = this.tokenRepository.createQueryBuilder("token");
    queryBuilder.orderBy("token.blockNumber", "DESC");
    queryBuilder.addOrderBy("token.logIndex", "DESC");
    return await paginate<Token>(queryBuilder, paginationOptions);
  }
}
