import { Injectable, Logger } from "@nestjs/common";
import { types } from "zksync-ethers";
import { BalanceService } from "../balance/balance.service";
import { TransferService } from "../transfer/transfer.service";
import { Transfer } from "../transfer/interfaces/transfer.interface";

export interface LogsData {
  transfers: Transfer[];
}

@Injectable()
export class LogService {
  private readonly logger: Logger;

  public constructor(
    private readonly balanceService: BalanceService,
    private readonly transferService: TransferService
  ) {
    this.logger = new Logger(LogService.name);
  }

  public async getData(
    logs: ReadonlyArray<types.Log>,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails,
    transactionReceipt?: types.TransactionReceipt
  ): Promise<LogsData> {
    const transfers = await this.transferService.getTransfers(
      logs,
      blockDetails,
      transactionDetails,
      transactionReceipt
    );

    const logsData: LogsData = {
      transfers,
    };

    this.balanceService.trackChangedBalances(transfers);

    return logsData;
  }
}
