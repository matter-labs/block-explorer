import { types } from "zksync-ethers";
import { BlockchainService } from "../../blockchain/blockchain.service";
import { Transfer } from "./transfer.interface";

export interface ExtractTransferHandler {
  matches: (log: types.Log, txReceipt?: types.TransactionReceipt, trustedBridgeAddresses?: Set<string>) => boolean;
  extract: (
    log: types.Log,
    blockchainService: BlockchainService,
    blockDetails: types.BlockDetails,
    transactionDetails?: types.TransactionDetails
  ) => Promise<Transfer | null>;
}
