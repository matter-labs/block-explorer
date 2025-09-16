import { Injectable } from "@nestjs/common";
import { type Block, type Log, type TransactionReceipt } from "ethers";
import { BalanceService } from "../balance/balance.service";
import { TransferService } from "../transfer/transfer.service";
import { Transfer } from "../transfer/interfaces/transfer.interface";

export interface LogsData {
  transfers: Transfer[];
}

@Injectable()
export class LogService {
  public constructor(
    private readonly balanceService: BalanceService,
    private readonly transferService: TransferService
  ) {}

  public async getData(
    logs: ReadonlyArray<Log>,
    block: Block,
    ethTransfers: Transfer[] = [],
    transactionReceipt?: TransactionReceipt
  ): Promise<LogsData> {
    const transfers = await this.transferService.getTransfers(logs, block, ethTransfers, transactionReceipt);

    const logsData: LogsData = {
      transfers,
    };

    this.balanceService.trackChangedBalances(transfers);

    return logsData;
  }
}
