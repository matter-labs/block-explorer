import { Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import {
  TransactionRepository,
  TransactionReceiptRepository,
  TransferRepository,
  AddressRepository,
  TokenRepository,
  LogRepository,
} from "../repositories";
import { TRANSACTION_PROCESSING_DURATION_METRIC_NAME } from "../metrics";
import { TransactionData } from "../dataFetcher/types";
import { getAddress } from "ethers";

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
    @InjectMetric(TRANSACTION_PROCESSING_DURATION_METRIC_NAME)
    private readonly transactionProcessingDurationMetric: Histogram
  ) {
    this.logger = new Logger(TransactionProcessor.name);
  }

  public async test() {
    const tx = await this.transactionRepository.findOneBy({
      hash: "0x3071841b9fb9ca6f329a7fa3d79970a36126e70d12d2210c7f47102bf81374d6",
    });
    const pls = await this.addressRepository.findOneBy({ address: "0xafb5167116e6b833889018916594ac8040dbc05f" });
    const addresses = await this.addressRepository.find({});
    const jedan = addresses[13];
    this.logger.debug({
      pls: pls,
    });
  }

  public async add(blockNumber: number, transactionData: TransactionData): Promise<void> {
    const stopTransactionProcessingMeasuring = this.transactionProcessingDurationMetric.startTimer();
    let isToEvmLike = false;
    if (transactionData.transaction.data.length > 2) {
      let a = null;
      while (a === null) {
        a = await this.addressRepository.findOneBy({ address: transactionData.transaction.to });
      }
      isToEvmLike = a?.isEvmLike ?? false;
      this.logger.debug({
        molimTe: a,
      });
    }

    this.logger.debug({
      message: "Saving transactions data to the DB",
      blockNumber: blockNumber,
      transactionHash: transactionData.transaction.hash,
      transactionData: transactionData,
    });

    await this.transactionRepository.add({
      ...transactionData.transaction,
      transactionIndex: transactionData.transaction.index,
      isEvmLike: transactionData.transaction.isEvmLike,
      isToEvmLike: isToEvmLike,
    });

    this.logger.debug({
      message: "Saving transaction receipts data to the DB",
      blockNumber: blockNumber,
      transactionHash: transactionData.transaction.hash,
    });
    await this.transactionReceiptRepository.add({
      ...transactionData.transactionReceipt,
      transactionIndex: transactionData.transactionReceipt.index,
      transactionHash: transactionData.transactionReceipt.hash,
      effectiveGasPrice: transactionData.transactionReceipt.gasPrice,
      type: transactionData.transaction.type,
      isEvmLike: transactionData.transaction.isEvmLike,
    });

    this.logger.debug({
      message: "Saving transaction logs data to the DB",
      blockNumber: blockNumber,
      transactionHash: transactionData.transaction.hash,
    });
    await this.logRepository.addMany(
      transactionData.transactionReceipt.logs.map((log) => ({
        ...log,
        timestamp: transactionData.transaction.receivedAt,
        logIndex: log.index,
        topics: [...log.topics],
      }))
    );

    this.logger.debug({
      message: "Saving transfers data to the DB",
      blockNumber: blockNumber,
      transactionHash: transactionData.transaction.hash,
    });
    await this.transferRepository.addMany(transactionData.transfers);

    this.logger.debug({
      message: "Saving contract addresses data to the DB",
      blockNumber: blockNumber,
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
      blockNumber: blockNumber,
      transactionHash: transactionData.transaction.hash,
    });
    await Promise.all(
      transactionData.tokens.map((token) => {
        return this.tokenRepository.upsert(token);
      })
    );

    stopTransactionProcessingMeasuring();
  }
}
