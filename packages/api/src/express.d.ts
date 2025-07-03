import "express";
import { FilterTransactionsOptions } from "./transaction/transaction.service";
import { FilterTransfersOptions } from "./transfer/transfer.service";
import { FilterLogsOptions } from "./log/log.service";

declare module "express" {
  export interface Response {
    locals: {
      filterTransactionsOptions?: FilterTransactionsOptions;
      filterAddressLogsOptions?: FilterLogsOptions;
      filterAddressTransferOptions?: FilterTransfersOptions;
      filterAddressOptions?: { includeBalances?: boolean };
      tokenTransfersOptions?: FilterTransfersOptions;
    };
  }
}
