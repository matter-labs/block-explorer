import { Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { types } from "zksync-web3";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BalanceService, BlockChangedBalances } from "../balance/balance.service";
import { TransactionService, TransactionData } from "../transaction";
import { Transfer } from "../transfer/interfaces/transfer.interface";
import { LogService, ExtractedLog, LogsData } from "../log";
import {
  BLOCK_PROCESSING_DURATION_METRIC_NAME,
  BALANCES_PROCESSING_DURATION_METRIC_NAME,
  GET_BLOCK_INFO_DURATION_METRIC_NAME,
  BlockProcessingMetricLabels,
  ProcessingActionMetricLabel,
} from "../metrics";

export interface BlockData {
  block: types.Block;
  blockDetails: types.BlockDetails;
  transactions: TransactionData[];
  logs?: ExtractedLog[];
  transfers?: Transfer[];
  changedBalances: BlockChangedBalances;
}

@Injectable()
export class BlockService {
  private readonly logger: Logger;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly transactionService: TransactionService,
    private readonly logService: LogService,
    private readonly balanceService: BalanceService,
    @InjectMetric(BLOCK_PROCESSING_DURATION_METRIC_NAME)
    private readonly processingDurationMetric: Histogram<BlockProcessingMetricLabels>,
    @InjectMetric(BALANCES_PROCESSING_DURATION_METRIC_NAME)
    private readonly balancesProcessingDurationMetric: Histogram,
    @InjectMetric(GET_BLOCK_INFO_DURATION_METRIC_NAME)
    private readonly getBlockInfoDurationMetric: Histogram<ProcessingActionMetricLabel>
  ) {
    this.logger = new Logger(BlockService.name);
  }

  public async getData(blockNumber: number): Promise<BlockData> {
    this.logger.debug({ message: "Getting block from the blockchain", blockNumber });
    const stopGetBlockInfoDurationMetric = this.getBlockInfoDurationMetric.startTimer();
    const [block, blockDetails] = await Promise.all([
      this.blockchainService.getBlock(blockNumber),
      this.blockchainService.getBlockDetails(blockNumber),
    ]);
    stopGetBlockInfoDurationMetric();

    let blockProcessingStatus = "success";
    this.logger.log({ message: `Adding block #${blockNumber}`, blockNumber });

    let transactions: TransactionData[] = [];
    let blockLogData: LogsData;
    let changedBalances: BlockChangedBalances;

    const stopDurationMeasuring = this.processingDurationMetric.startTimer();
    try {
      transactions = await Promise.all(
        block.transactions.map((transactionHash) => this.transactionService.getData(transactionHash, blockDetails))
      );

      if (block.transactions.length === 0) {
        const logs = await this.blockchainService.getLogs({
          fromBlock: blockNumber,
          toBlock: blockNumber,
        });

        blockLogData = await this.logService.getData(logs, blockDetails);
      }

      const stopBalancesDurationMeasuring = this.balancesProcessingDurationMetric.startTimer();
      this.logger.debug({ message: "Getting balances and tokens", blockNumber });
      changedBalances = await this.balanceService.getChangedBalances(blockNumber);
      stopBalancesDurationMeasuring();
    } catch (error) {
      blockProcessingStatus = "error";
      throw error;
    } finally {
      this.balanceService.clearTrackedState(blockNumber);
      stopDurationMeasuring({ status: blockProcessingStatus, action: "get" });
    }

    return {
      block,
      blockDetails,
      logs: blockLogData?.logs,
      transfers: blockLogData?.transfers,
      transactions,
      changedBalances,
    };
  }
}
