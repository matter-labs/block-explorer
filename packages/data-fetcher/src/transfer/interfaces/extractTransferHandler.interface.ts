import { type Log, type Block, type TransactionReceipt } from "ethers";
import { ConfigService } from "@nestjs/config";
import { BlockchainService } from "../../blockchain/blockchain.service";
import { Transfer } from "./transfer.interface";

// Most events describe a single transfer, batch events (e.g. ERC1155 TransferBatch) describe several.
export interface ExtractTransferHandler<TResult extends Transfer | Transfer[] = Transfer> {
  matches: (log: Log, txReceipt: TransactionReceipt, configService?: ConfigService) => boolean;
  extract: (log: Log, blockchainService: BlockchainService, block: Block) => Promise<TResult | null>;
}
