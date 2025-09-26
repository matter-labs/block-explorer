import { Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { L1_ORIGINATED_TX_TYPES } from "../constants";
import {
  TransactionRepository,
  TransactionReceiptRepository,
  TransferRepository,
  AddressRepository,
  TokenRepository,
  LogRepository,
} from "../repositories";
import { TRANSACTION_PROCESSING_DURATION_METRIC_NAME } from "../metrics";
import { TransactionData, BlockInfo } from "../dataFetcher/types";
import { ConfigService } from "@nestjs/config";
import { utils } from "zksync-ethers";
import { unixTimeToDate } from "../utils/date";

@Injectable()
export class TransactionProcessor {
  private readonly logger: Logger;

  public constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionReceiptRepository: TransactionReceiptRepository,
    private readonly logRepository: LogRepository,
    private readonly transferRepository: TransferRepository,
    private readonly addressRepository: AddressRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly configService: ConfigService,
    @InjectMetric(TRANSACTION_PROCESSING_DURATION_METRIC_NAME)
    private readonly transactionProcessingDurationMetric: Histogram
  ) {
    this.logger = new Logger(TransactionProcessor.name);
  }

  public async add(block: BlockInfo, transactionData: TransactionData): Promise<void> {
    const stopTransactionProcessingMeasuring = this.transactionProcessingDurationMetric.startTimer();

    this.logger.debug({
      message: "Saving transactions data to the DB",
      blockNumber: block.number,
      transactionHash: transactionData.transaction.hash,
    });

    await this.transactionRepository.add({
      ...transactionData.transaction,
      // TODO: rename transactionIndex to index to avoid unnecessary field mapping
      transactionIndex: transactionData.transaction.index,
      receivedAt: unixTimeToDate(block.timestamp).toISOString(),
      isL1Originated: L1_ORIGINATED_TX_TYPES.includes(transactionData.transaction.type),
      fee: (
        BigInt(transactionData.transactionReceipt.gasUsed) * BigInt(transactionData.transactionReceipt.gasPrice)
      ).toString(),
      receiptStatus: transactionData.transactionReceipt.status,
    });

    this.logger.debug({
      message: "Saving transaction receipts data to the DB",
      blockNumber: block.number,
      transactionHash: transactionData.transaction.hash,
    });
    await this.transactionReceiptRepository.add({
      ...transactionData.transactionReceipt,
      // TODO: rename transactionIndex to index to avoid unnecessary field mapping
      transactionIndex: transactionData.transactionReceipt.index,
      transactionHash: transactionData.transactionReceipt.hash,
      effectiveGasPrice: transactionData.transactionReceipt.gasPrice.toString(),
      gasUsed: transactionData.transactionReceipt.gasUsed.toString(),
      cumulativeGasUsed: transactionData.transactionReceipt.cumulativeGasUsed.toString(),
    });

    this.logger.debug({
      message: "Saving transaction logs data to the DB",
      blockNumber: block.number,
      transactionHash: transactionData.transaction.hash,
    });
    await this.logRepository.addMany(
      transactionData.transactionReceipt.logs.map((log) => ({
        ...log,
        timestamp: unixTimeToDate(block.timestamp).toISOString(),
        // TODO: rename logIndex to index to avoid unnecessary field mapping
        logIndex: log.index,
        topics: [...log.topics],
      }))
    );

    this.logger.debug({
      message: "Saving transfers data to the DB",
      blockNumber: block.number,
      transactionHash: transactionData.transaction.hash,
    });
    await this.transferRepository.addMany(transactionData.transfers);

    this.logger.debug({
      message: "Saving contract addresses data to the DB",
      blockNumber: block.number,
      transactionHash: transactionData.transaction.hash,
    });
    await Promise.all(
      transactionData.contractAddresses.map((contractAddress) => {
        return this.addressRepository.upsert({
          address: contractAddress.address,
          bytecode: contractAddress.bytecode,
          createdInBlockNumber: contractAddress.blockNumber,
          creatorTxHash: contractAddress.transactionHash,
          creatorAddress: contractAddress.creatorAddress,
          createdInLogIndex: contractAddress.logIndex,
          isEvmLike: contractAddress.isEvmLike,
        });
      })
    );

    this.logger.debug({
      message: "Saving tokens to the DB",
      blockNumber: block.number,
      transactionHash: transactionData.transaction.hash,
    });
    await Promise.all(
      transactionData.tokens.map((token) => {
        if (token.l2Address.toLowerCase() === utils.L2_BASE_TOKEN_ADDRESS.toLowerCase()) {
          return this.tokenRepository.upsert({
            blockNumber: token.blockNumber,
            transactionHash: token.transactionHash,
            logIndex: token.logIndex,
            l2Address: utils.L2_BASE_TOKEN_ADDRESS,
            l1Address: this.configService.get<string>("tokens.baseToken.l1Address"),
            symbol: this.configService.get<string>("tokens.baseToken.symbol"),
            name: this.configService.get<string>("tokens.baseToken.name"),
            decimals: this.configService.get<number>("tokens.baseToken.decimals"),
            iconURL: this.configService.get<string>("tokens.baseToken.iconUrl"),
          });
        } else {
          return this.tokenRepository.upsert(token);
        }
      })
    );

    stopTransactionProcessingMeasuring();
  }
}
