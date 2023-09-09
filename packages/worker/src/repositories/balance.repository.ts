import { Injectable } from "@nestjs/common";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { Balance } from "../entities";

export const deleteOldBalancesScript = `
  DELETE FROM balances
  USING
  (
    SELECT address, "tokenAddress", MAX("blockNumber") AS "blockNumber" 
    FROM balances
    WHERE "blockNumber" > $1 AND "blockNumber" <= $2 
    GROUP BY (address, "tokenAddress")
  ) as latest_balances_to_leave
  WHERE 
    balances.address = latest_balances_to_leave.address AND
    balances."tokenAddress" = latest_balances_to_leave."tokenAddress" AND
    balances."blockNumber" < latest_balances_to_leave."blockNumber"
`;

export const deleteZeroBalancesScript = `
  DELETE FROM balances
  USING
  (
    SELECT address, "tokenAddress", "blockNumber"
    FROM balances
    WHERE "blockNumber" > $1 AND "blockNumber" <= $2 AND balance = '0'
  ) AS zero_balances
  WHERE 
    balances.address = zero_balances.address AND
    balances."tokenAddress" = zero_balances."tokenAddress" AND
    balances."blockNumber" <= zero_balances."blockNumber"
`;

@Injectable()
export class BalanceRepository extends BaseRepository<Balance> {
  public constructor(unitOfWork: UnitOfWork) {
    super(Balance, unitOfWork);
  }

  public async deleteOldBalances(fromBlockNumber: number, toBlockNumber: number): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.query(deleteOldBalancesScript, [fromBlockNumber, toBlockNumber]);
  }

  public async deleteZeroBalances(fromBlockNumber: number, toBlockNumber: number): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.query(deleteZeroBalancesScript, [fromBlockNumber, toBlockNumber]);
  }

  public async getDeleteBalancesFromBlockNumber(): Promise<number> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    const [fromBlockNumber] = await transactionManager.query(
      `SELECT last_value FROM "deleteBalances_fromBlockNumber";`
    );
    return Number(fromBlockNumber.last_value);
  }

  public async setDeleteBalancesFromBlockNumber(fromBlockNumber: number): Promise<void> {
    const transactionManager = this.unitOfWork.getTransactionManager();
    await transactionManager.query(`SELECT setval('"deleteBalances_fromBlockNumber"', $1, false);`, [fromBlockNumber]);
  }
}
