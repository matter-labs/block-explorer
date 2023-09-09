import { types } from "zksync-web3";
import { BridgeAddresses } from "../../blockchain";
import { Transfer } from "./transfer.interface";

export interface ExtractTransferHandler {
  matches: (log: types.Log, txReceipt?: types.TransactionReceipt, bridgeAddresses?: BridgeAddresses) => boolean;
  extract: (
    log: types.Log,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ) => Transfer | null;
}
