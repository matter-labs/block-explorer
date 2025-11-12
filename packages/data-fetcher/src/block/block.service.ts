import { Injectable, Logger } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { type Block } from "ethers";
import { BlockchainService } from "../blockchain/blockchain.service";
import { BalanceService, Balance } from "../balance/balance.service";
import { TransactionService, TransactionData } from "../transaction";
import {
  BLOCK_PROCESSING_DURATION_METRIC_NAME,
  BALANCES_PROCESSING_DURATION_METRIC_NAME,
  GET_BLOCK_INFO_DURATION_METRIC_NAME,
  BlockProcessingMetricLabels,
  ProcessingActionMetricLabel,
} from "../metrics";

export interface BlockData {
  block: Block;
  transactions: TransactionData[];
  changedBalances: Balance[];
}

@Injectable()
export class BlockService {
  private readonly logger: Logger;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly transactionService: TransactionService,
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

  public async getData(blockNumber: number): Promise<BlockData | null> {
    const stopDurationMeasuring = this.processingDurationMetric.startTimer();

    this.logger.debug({ message: "Getting block data from the blockchain", blockNumber });
    const stopGetBlockInfoDurationMetric = this.getBlockInfoDurationMetric.startTimer();
    const [block, blockTraces] = await Promise.all([
      this.blockchainService.getBlock(blockNumber),
      this.blockchainService.debugTraceBlock(blockNumber),
    ]);
    stopGetBlockInfoDurationMetric();

    if (!block) {
      return null;
    }

    let blockProcessingStatus = "success";
    let transactions: TransactionData[] = [];
    let changedBalances: Balance[];

    try {
      transactions = await Promise.all(
        blockTraces.map((trace) => this.transactionService.getData(trace.txHash, trace.result, block))
      );

      const stopBalancesDurationMeasuring = this.balancesProcessingDurationMetric.startTimer();
      this.logger.debug({ message: "Getting balances", blockNumber });
      changedBalances = await this.balanceService.getChangedBalances(blockNumber);
      stopBalancesDurationMeasuring();
    } catch (error) {
      blockProcessingStatus = "error";
      throw error;
    } finally {
      this.balanceService.clearTrackedState(blockNumber);
      stopDurationMeasuring({ status: blockProcessingStatus, action: "get" });
    }

    this.logger.debug({ message: "Successfully generated block data", blockNumber });
    return {
      block,
      transactions,
      changedBalances: changedBalances || [],
    };
  }
}
