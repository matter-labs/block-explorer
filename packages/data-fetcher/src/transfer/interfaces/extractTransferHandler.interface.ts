import { type Log, type Block, type TransactionReceipt } from "ethers";
import { ConfigService } from "@nestjs/config";
import { BlockchainService } from "../../blockchain/blockchain.service";
import { Transfer } from "./transfer.interface";

export interface ExtractTransferHandler {
  matches: (log: Log, txReceipt: TransactionReceipt, configService?: ConfigService) => boolean;
  extract: (log: Log, blockchainService: BlockchainService, block: Block) => Promise<Transfer | null>;
}
