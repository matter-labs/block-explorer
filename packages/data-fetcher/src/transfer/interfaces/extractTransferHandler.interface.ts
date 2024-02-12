import { types } from "zksync-web3";
import { Transfer } from "./transfer.interface";

export interface ExtractTransferHandler {
  matches: (log: types.Log, txReceipt?: types.TransactionReceipt) => boolean;
  extract: (
    log: types.Log,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ) => Transfer | null;
}
