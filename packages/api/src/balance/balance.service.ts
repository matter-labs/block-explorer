import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Balance } from "./balance.entity";
import { Token } from "../token/token.entity";
import { hexTransformer } from "../common/transformers/hex.transformer";

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
}
