import { Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { types } from "zksync-ethers";
import { BlockchainService } from "../blockchain/blockchain.service";
import { TRANSACTION_PROCESSING_DURATION_METRIC_NAME, GET_TRANSACTION_INFO_DURATION_METRIC_NAME } from "../metrics";
import { LogService, LogsData } from "../log/log.service";

export interface TransactionInfo extends types.TransactionResponse {
  fee: string;
  receiptStatus: number;
  isL1Originated: boolean;
  receivedAt: Date;
  error?: string;
  revertReason?: string;
}

export interface TransactionData extends LogsData {
  transaction: TransactionInfo;
  transactionReceipt: types.TransactionReceipt;
}

@Injectable()
export class TransactionService {
  private readonly logger: Logger;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly logService: LogService,
    @InjectMetric(TRANSACTION_PROCESSING_DURATION_METRIC_NAME)
    private readonly transactionProcessingDurationMetric: Histogram,
    @InjectMetric(GET_TRANSACTION_INFO_DURATION_METRIC_NAME)
    private readonly getTransactionInfoDurationMetric: Histogram
  ) {
    this.logger = new Logger(TransactionService.name);
  }

  public async getData(transactionHash: string, blockDetails: types.BlockDetails): Promise<TransactionData> {
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

    const transactionInfo = {
      ...transaction,
      ...transactionDetails,
      l1BatchNumber: blockDetails.l1BatchNumber,
      receiptStatus: transactionReceipt.status,
    } as unknown as TransactionInfo;

    if (transactionReceipt.status === 0) {
      const debugTraceTransactionResult = await this.blockchainService.debugTraceTransaction(transactionHash, true);
      if (debugTraceTransactionResult?.error) {
        transactionInfo.error = debugTraceTransactionResult.error;
      }
      if (debugTraceTransactionResult?.revertReason) {
        transactionInfo.revertReason = debugTraceTransactionResult.revertReason;
      }
    }

    const logsData = await this.logService.getData(
      transactionReceipt.logs,
      blockDetails,
      transactionDetails,
      transactionReceipt
    );

    stopTransactionProcessingMeasuring();

    return {
      ...logsData,
      transaction: transactionInfo,
      transactionReceipt,
    };
  }
}
