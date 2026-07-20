import { Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { type Block, type TransactionReceipt, type TransactionResponse } from "ethers";
import { BlockchainService, TransactionTrace } from "../blockchain/blockchain.service";
import { TRANSACTION_PROCESSING_DURATION_METRIC_NAME, GET_TRANSACTION_INFO_DURATION_METRIC_NAME } from "../metrics";
import { LogService, LogsData } from "../log/log.service";
import { Token } from "../token/token.service";
import { TransactionTracesService, ContractAddress } from "./transactionTraces.service";
import { BalanceService } from "../balance/balance.service";

export interface TransactionInfo extends TransactionResponse {
  error?: string;
  revertReason?: string;
}

export interface TransactionData extends LogsData {
  transaction: TransactionInfo;
  transactionReceipt: TransactionReceipt;
  contractAddresses: ContractAddress[];
  tokens?: Token[];
}

@Injectable()
export class TransactionService {
  private readonly logger: Logger;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly transactionTracesService: TransactionTracesService,
    private readonly logService: LogService,
    private readonly balanceService: BalanceService,
    @InjectMetric(TRANSACTION_PROCESSING_DURATION_METRIC_NAME)
    private readonly transactionProcessingDurationMetric: Histogram,
    @InjectMetric(GET_TRANSACTION_INFO_DURATION_METRIC_NAME)
    private readonly getTransactionInfoDurationMetric: Histogram
  ) {
    this.logger = new Logger(TransactionService.name);
  }

  public async getData(
    transactionHash: string,
    transactionTrace: TransactionTrace | null,
    block: Block
  ): Promise<TransactionData> {
    const stopTransactionProcessingMeasuring = this.transactionProcessingDurationMetric.startTimer();

    this.logger.debug({
      message: "Getting transaction data from the blockchain",
      blockNumber: block.number,
      transactionHash,
    });
    const stopGetTransactionInfoDurationMetric = this.getTransactionInfoDurationMetric.startTimer();
    const [transaction, transactionReceipt] = await Promise.all([
      this.blockchainService.getTransaction(transactionHash),
      this.blockchainService.getTransactionReceipt(transactionHash),
    ]);
    stopGetTransactionInfoDurationMetric();

    if (!transaction || !transactionReceipt) {
      throw new Error(`Some of the blockchain transaction APIs returned null for a transaction ${transactionHash}`);
    }

    // Guard against the RPC reporting the transaction as pending (e.g. transient reorg
    // or a behind-the-tip node behind a load balancer). Throwing forces a retry on a consistent
    // view, instead of inserting nulls that violate NOT NULL constraints downstream.
    if (
      transaction.index == null ||
      transactionReceipt.index == null ||
      transaction.blockHash !== block.hash ||
      transactionReceipt.blockHash !== block.hash
    ) {
      throw new Error(
        `Inconsistent transaction state for ${transactionHash} in block #${block.number}: ` +
          `expected blockHash ${block.hash}, got tx.blockHash=${transaction.blockHash} ` +
          `(index=${transaction.index}), receipt.blockHash=${transactionReceipt.blockHash} ` +
          `(index=${transactionReceipt.index})`
      );
    }

    this.balanceService.trackSenderBalance(transaction.from.toLowerCase(), block.number);

    const transactionInfo = {
      ...transaction,
      receiptStatus: transactionReceipt.status,
    } as unknown as TransactionInfo;

    const transactionTraceData = await this.transactionTracesService.getData(
      block,
      transaction,
      transactionReceipt,
      transactionTrace
    );
    if (transactionReceipt.status === 0) {
      transactionInfo.error = transactionTraceData.error;
      transactionInfo.revertReason = transactionTraceData.revertReason;
    }

    const logsData = await this.logService.getData(
      transactionReceipt.logs,
      block,
      transactionTraceData.transfers,
      transactionReceipt
    );

    stopTransactionProcessingMeasuring();

    return {
      ...logsData,
      transaction: transactionInfo,
      transactionReceipt,
      contractAddresses: transactionTraceData.contractAddresses,
      tokens: transactionTraceData.tokens,
    };
  }
}
