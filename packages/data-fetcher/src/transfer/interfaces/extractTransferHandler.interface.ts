import { type Log, type Block, type TransactionReceipt } from "ethers";
import { BlockchainService } from "../../blockchain/blockchain.service";
import { Transfer } from "./transfer.interface";

export interface ExtractTransferHandler {
  matches: (log: Log, txReceipt: TransactionReceipt) => boolean;
  extract: (log: Log, blockchainService: BlockchainService, block: Block) => Promise<Transfer | null>;
}
