import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Balance } from "./balance.entity";
import { Token } from "../token/token.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { BalanceForHolderDto } from "./balanceForHolder.dto";
import { paginate } from "../common/utils";
import { IPaginationOptions, Pagination } from "nestjs-typeorm-paginate";

export interface TokenBalance {
  balance: string;
  token: Token;
}

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>
  ) {}

  public async getBalances(address: string): Promise<{ balances: Record<string, TokenBalance>; blockNumber: number }> {
    const latestBalancesQuery = this.balanceRepository.createQueryBuilder("latest_balances");
    latestBalancesQuery.select("address");
    latestBalancesQuery.addSelect(`"tokenAddress"`);
    latestBalancesQuery.addSelect(`MAX("blockNumber")`, "blockNumber");
    latestBalancesQuery.where("address = :address");
    latestBalancesQuery.groupBy("address");
    latestBalancesQuery.addGroupBy(`"tokenAddress"`);

    const balancesQuery = this.balanceRepository.createQueryBuilder("balances");
    balancesQuery.innerJoin(
      `(${latestBalancesQuery.getQuery()})`,
      "latest_balances",
      `balances.address = latest_balances.address AND
      balances."tokenAddress" = latest_balances."tokenAddress" AND
      balances."blockNumber" = latest_balances."blockNumber"`
    );
    balancesQuery.setParameter("address", hexTransformer.to(address));
    balancesQuery.leftJoinAndSelect("balances.token", "token");

    const balancesRecords = await balancesQuery.getMany();
    const balances: Record<string, TokenBalance> = {};

    let highestBlockNumber = 0;
    balancesRecords.forEach((balanceRecord) => {
      balances[balanceRecord.tokenAddress] = {
        balance: balanceRecord.balance,
        token: balanceRecord.token,
      };
      highestBlockNumber = Math.max(highestBlockNumber, balanceRecord.blockNumber);
    });

    return {
      balances,
      blockNumber: highestBlockNumber,
    };
  }

  public async getBalance(address: string, tokenAddress: string): Promise<string> {
    const balance = await this.balanceRepository.findOne({
      where: {
        address,
        tokenAddress,
      },
      select: {
        balance: true,
      },
      order: {
        blockNumber: "DESC",
      },
    });
    return balance?.balance || "0";
  }

  public async getBalancesByAddresses(addresses: string[], tokenAddress: string): Promise<Balance[]> {
    const latestBalancesQuery = this.balanceRepository.createQueryBuilder("latest_balances");
    latestBalancesQuery.select("address");
    latestBalancesQuery.addSelect(`"tokenAddress"`);
    latestBalancesQuery.addSelect(`MAX("blockNumber")`, "blockNumber");
    latestBalancesQuery.where(`"tokenAddress" = :tokenAddress`);
    latestBalancesQuery.andWhere("address IN(:...addresses)");
    latestBalancesQuery.groupBy("address");
    latestBalancesQuery.addGroupBy(`"tokenAddress"`);

    const balancesQuery = this.balanceRepository.createQueryBuilder("balances");
    balancesQuery.select("balances.address");
    balancesQuery.addSelect("balances.balance");
    balancesQuery.innerJoin(
      `(${latestBalancesQuery.getQuery()})`,
      "latest_balances",
      `balances.address = latest_balances.address AND
      balances."tokenAddress" = latest_balances."tokenAddress" AND
      balances."blockNumber" = latest_balances."blockNumber"`
    );
    balancesQuery.setParameter("tokenAddress", hexTransformer.to(tokenAddress));
    balancesQuery.setParameter(
      "addresses",
      addresses.map((address) => hexTransformer.to(address))
    );
    const balancesRecords = await balancesQuery.getMany();
    return balancesRecords;
  }

  public async getBalancesForTokenAddress(
    tokenAddress: string,
    paginationOptions?: IPaginationOptions
  ): Promise<Pagination<BalanceForHolderDto>> {
    const latestBalancesQuery = this.balanceRepository.createQueryBuilder("latest_balances");
    latestBalancesQuery.select(`"tokenAddress"`);
    latestBalancesQuery.addSelect(`"address"`);
    latestBalancesQuery.addSelect(`MAX("blockNumber")`, "blockNumber");
    latestBalancesQuery.where(`"tokenAddress" = :tokenAddress`);
    latestBalancesQuery.groupBy(`"tokenAddress"`);
    latestBalancesQuery.addGroupBy(`"address"`);

    const balancesQuery = this.balanceRepository.createQueryBuilder("balances");
    balancesQuery.innerJoin(
      `(${latestBalancesQuery.getQuery()})`,
      "latest_balances",
      `balances."tokenAddress" = latest_balances."tokenAddress" AND
      balances."address" = latest_balances."address" AND
      balances."blockNumber" = latest_balances."blockNumber"`
    );
    balancesQuery.setParameter("tokenAddress", hexTransformer.to(tokenAddress));
    balancesQuery.leftJoinAndSelect("balances.token", "token");
    balancesQuery.orderBy(`CAST(balances.balance AS NUMERIC)`, "DESC");

    const balancesForToken = await paginate<Balance>(balancesQuery, paginationOptions);

    return {
      ...balancesForToken,
      items: balancesForToken.items.map((item) => {
        return {
          balance: item.balance,
          address: item.address,
        };
      }),
    };
  }
}
