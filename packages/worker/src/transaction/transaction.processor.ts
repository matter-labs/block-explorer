import { Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { types } from "zksync-web3";
import { BlockchainService } from "../blockchain/blockchain.service";
import { TransactionRepository, TransactionDto, TransactionReceiptRepository } from "../repositories";
import { TRANSACTION_PROCESSING_DURATION_METRIC_NAME, GET_TRANSACTION_INFO_DURATION_METRIC_NAME } from "../metrics";
import { LogProcessor } from "../log/log.processor";

@Injectable()
export class TransactionProcessor {
  private readonly logger: Logger;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly logProcessor: LogProcessor,
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionReceiptRepository: TransactionReceiptRepository,
    @InjectMetric(TRANSACTION_PROCESSING_DURATION_METRIC_NAME)
    private readonly transactionProcessingDurationMetric: Histogram,
    @InjectMetric(GET_TRANSACTION_INFO_DURATION_METRIC_NAME)
    private readonly getTransactionInfoDurationMetric: Histogram
  ) {
    this.logger = new Logger(TransactionProcessor.name);
  }

  public async add(transactionHash: string, blockDetails: types.BlockDetails): Promise<void> {
    const stopTransactionProcessingMeasuring = this.transactionProcessingDurationMetric.startTimer();

    this.logger.debug({
      message: "Getting transaction data from the blockchain",
      blockNumber: blockDetails.number,
      transactionHash,
    });
    const stopGetTransactionInfoDurationMetric = this.getTransactionInfoDurationMetric.startTimer();
    const [transaction, transactionDetails, transactionReceipt] = await Promise.all([
      this.blockchainService.getTransaction(transactionHash),
      this.blockchainService.getTransactionDetails(transactionHash),
      this.blockchainService.getTransactionReceipt(transactionHash),
    ]);
    stopGetTransactionInfoDurationMetric();

    if (!transaction || !transactionDetails || !transactionReceipt) {
      throw new Error(`Some of the blockchain transaction APIs returned null for a transaction ${transactionHash}`);
    }

    this.logger.debug({
      message: "Adding transaction data to the DB",
      blockNumber: blockDetails.number,
      transactionHash,
    });
    await this.transactionRepository.add({
      ...transaction,
      ...transactionDetails,
      l1BatchNumber: blockDetails.l1BatchNumber,
      receiptStatus: transactionReceipt.status,
    } as TransactionDto);

    this.logger.debug({
      message: "Adding transaction receipt data to the DB",
      blockNumber: blockDetails.number,
      transactionHash,
    });
    await this.transactionReceiptRepository.add(transactionReceipt);

    await this.logProcessor.process(transactionReceipt.logs, blockDetails, transactionDetails, transactionReceipt);

    stopTransactionProcessingMeasuring();
  }
}
