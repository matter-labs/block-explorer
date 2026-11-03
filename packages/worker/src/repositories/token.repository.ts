import { Injectable } from "@nestjs/common";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { IsNull, Not, FindOptionsSelect, FindOptionsWhere } from "typeorm";
import { Token } from "../entities";
import { BaseRepository } from "./base.repository";
import { UnitOfWork } from "../unitOfWork";
import { ETH_ADDRESS_IN_CONTRACTS, ZERO_ADDRESS } from "../constants";

// Native ETH is stored with the zero address as its L1 address when it is the
// base token, but bridged ETH carries the asset router sentinel 0x...01.
// Off-chain data providers report ETH under the zero address, so it has to
// match both.
const ETH_L1_ADDRESSES = [ZERO_ADDRESS, ETH_ADDRESS_IN_CONTRACTS];

@Injectable()
export class TokenRepository extends BaseRepository<Token> {
  public constructor(unitOfWork: UnitOfWork) {
    super(Token, unitOfWork);
  }

  public override async upsert(addressDto: QueryDeepPartialEntity<Token>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const queryBuilder = transactionManager.createQueryBuilder().insert();
    queryBuilder.into(this.entityTarget);
    queryBuilder.values(addressDto);
    queryBuilder.onConflict(`("l2Address") DO UPDATE 
        SET 
          "updatedAt" = CURRENT_TIMESTAMP,
          symbol = EXCLUDED.symbol,
          name = EXCLUDED.name,
          decimals = EXCLUDED.decimals,
          "blockNumber" = EXCLUDED."blockNumber",
          "l1Address" = EXCLUDED."l1Address",
          "transactionHash" = EXCLUDED."transactionHash",
          "logIndex" = EXCLUDED."logIndex"
        WHERE 
          tokens."blockNumber" IS NULL OR
          EXCLUDED."blockNumber" > tokens."blockNumber" OR 
          (EXCLUDED."blockNumber" = tokens."blockNumber" AND EXCLUDED."logIndex" > tokens."logIndex")
      `);
    await queryBuilder.execute();
  }

  public async getOffChainDataLastUpdatedAt(): Promise<Date> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const token = await transactionManager.findOne(this.entityTarget, {
      where: {
        offChainDataUpdatedAt: Not(IsNull()),
      },
      select: {
        offChainDataUpdatedAt: true,
      },
      order: {
        offChainDataUpdatedAt: "DESC",
      },
    });
    return token?.offChainDataUpdatedAt;
  }

  public async getBridgedTokens(fields: FindOptionsSelect<Token> = { l1Address: true }): Promise<Token[]> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const tokens = await transactionManager.find(this.entityTarget, {
      where: {
        l1Address: Not(IsNull()),
      },
      select: fields,
    });
    return tokens;
  }

  public async update(l2Address: string, fieldsToUpdate: QueryDeepPartialEntity<Token>): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.update(this.entityTarget, { l2Address }, fieldsToUpdate);
  }

  public async updateTokenOffChainData({
    l1Address,
    l2Address,
    liquidity,
    usdPrice,
    updatedAt,
    iconURL,
  }: {
    l1Address?: string;
    l2Address?: string;
    liquidity?: number;
    usdPrice?: number;
    updatedAt?: Date;
    iconURL?: string;
  }): Promise<void> {
    if (!l1Address && !l2Address) {
      throw new Error("l1Address or l2Address must be provided");
    }
    const transactionManager = this.unitOfWork.getTransactionManager();
    let criteria: FindOptionsWhere<Token> | FindOptionsWhere<Token>[] = l1Address ? { l1Address } : { l2Address };
    if (l1Address && ETH_L1_ADDRESSES.includes(l1Address.toLowerCase())) {
      // One condition per address (OR) rather than In(), so each value still
      // goes through the bytea column transformer.
      criteria = ETH_L1_ADDRESSES.map((address) => ({ l1Address: address }));
    }
    await transactionManager.update(this.entityTarget, criteria, {
      liquidity,
      usdPrice,
      offChainDataUpdatedAt: updatedAt,
      ...(iconURL && {
        iconURL,
      }),
    });
  }
}
