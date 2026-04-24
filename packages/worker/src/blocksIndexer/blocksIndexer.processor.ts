import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Histogram } from "prom-client";
import { UnitOfWork } from "../unitOfWork";
import { BlockData } from "../dataFetcher/types";
import { DataFetcherService } from "../dataFetcher/dataFetcher.service";
import { BalanceService } from "../balance/balance.service";
import { TokenService } from "../token/token.service";
import { BlockRepository, BlockQueueRepository } from "../repositories";
import { TransactionProcessor } from "../transaction";
import {
  BLOCKS_BATCH_PROCESSING_DURATION_METRIC_NAME,
  BLOCK_PROCESSING_DURATION_METRIC_NAME,
  BlocksBatchProcessingMetricLabels,
  BlockProcessingMetricLabels,
} from "../metrics";
import { L1_ORIGINATED_TX_TYPES } from "../constants";
import { unixTimeToDate } from "../utils/date";

@Injectable()
export class BlocksIndexerProcessor {
  private readonly logger: Logger;
  private readonly blocksProcessingBatchSize: number;

  public constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly transactionProcessor: TransactionProcessor,
    private readonly balanceService: BalanceService,
    private readonly tokenService: TokenService,
    private readonly dataFetcherService: DataFetcherService,
    private readonly blockRepository: BlockRepository,
    private readonly blockQueueRepository: BlockQueueRepository,
    @InjectMetric(BLOCKS_BATCH_PROCESSING_DURATION_METRIC_NAME)
    private readonly blocksBatchProcessingDurationMetric: Histogram<BlocksBatchProcessingMetricLabels>,
    @InjectMetric(BLOCK_PROCESSING_DURATION_METRIC_NAME)
    private readonly processingDurationMetric: Histogram<BlockProcessingMetricLabels>,
    configService: ConfigService
  ) {
    this.logger = new Logger(BlocksIndexerProcessor.name);
    this.blocksProcessingBatchSize = configService.get<number>("blocks.blocksProcessingBatchSize");
  }

  public async processNextBlocksRange(): Promise<boolean> {
    let didWork = false;
    let stopDurationMeasuring: ReturnType<Histogram<BlocksBatchProcessingMetricLabels>["startTimer"]> | null = null;

    try {
      await this.unitOfWork
        .useTransaction(async () => {
          const blockNumbers = await this.blockQueueRepository.claim(this.blocksProcessingBatchSize);
          if (blockNumbers.length === 0) {
            return;
          }
          stopDurationMeasuring = this.blocksBatchProcessingDurationMetric.startTimer();

          const processedBlockNumbers: number[] = [];
          await Promise.all(
            blockNumbers.map(async (blockNumber) => {
              let blockData: BlockData;
              try {
                blockData = await this.dataFetcherService.getBlockData(blockNumber);
              } catch (error) {
                this.logger.error({
                  message: "Failed to fetch block data, will retry next iteration",
                  blockNumber,
                  stack: error.stack,
                });
                return;
              }
              if (!blockData?.block) {
                this.logger.warn({
                  message: "Block not yet available from the blockchain, will retry next iteration",
                  blockNumber,
                });
                return;
              }
              await this.addBlock(blockData);
              processedBlockNumbers.push(blockNumber);
            })
          );

          if (processedBlockNumbers.length === 0) {
            return;
          }
          await this.blockQueueRepository.remove(processedBlockNumbers);
          didWork = true;
        })
        .waitForExecution();
      stopDurationMeasuring?.({ status: "success" });
    } catch (error) {
      stopDurationMeasuring?.({ status: "error" });
      throw error;
    }

    return didWork;
  }

  private async addBlock(blockData: BlockData): Promise<void> {
    let blockProcessingStatus = "success";

    const { block } = blockData;
    const blockNumber = block.number;
    this.logger.log({ message: `Adding block #${blockNumber}`, blockNumber });

    const stopDurationMeasuring = this.processingDurationMetric.startTimer();
    try {
      const l1TxCount = blockData.transactions.filter((tx) =>
        L1_ORIGINATED_TX_TYPES.includes(tx.transaction.type)
      ).length;
      await this.blockRepository.add({
        ...block,
        l1TxCount: l1TxCount,
        l2TxCount: blockData.transactions.length - l1TxCount,
        timestamp: unixTimeToDate(block.timestamp),
      });

      await Promise.all(blockData.transactions.map((transaction) => this.transactionProcessor.add(block, transaction)));

      if (blockData.changedBalances.length) {
        this.logger.debug({ message: "Updating balances and tokens", blockNumber });
        const erc20TokensForChangedBalances = this.balanceService.getERC20TokensForChangedBalances(
          blockData.changedBalances
        );

        await Promise.all([
          this.balanceService.saveChangedBalances(blockData.changedBalances),
          this.tokenService.saveERC20Tokens(erc20TokensForChangedBalances),
        ]);
      }
    } catch (error) {
      blockProcessingStatus = "error";
      throw error;
    } finally {
      stopDurationMeasuring({ status: blockProcessingStatus, action: "add" });
    }
  }
}
