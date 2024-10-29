import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Gauge, Histogram } from "prom-client";
import { DataFetcherService } from "../dataFetcher/dataFetcher.service";
import { BlockData } from "../dataFetcher/types";
import { BlockchainService } from "../blockchain/blockchain.service";
import {
  BLOCKCHAIN_BLOCKS_METRIC_NAME,
  BLOCKS_TO_PROCESS_METRIC_NAME,
  GET_BLOCK_INFO_DURATION_METRIC_NAME,
  ProcessingActionMetricLabel,
} from "../metrics";

@Injectable()
export class BlockWatcher implements OnModuleInit, OnModuleDestroy {
  private lastBlockchainBlockNumber: number = null;
  private nextBlockNumberToProcess: number = null;
  private readonly logger: Logger;
  private readonly batchSize: number;
  private readonly fromBlock: number;
  private readonly toBlock: number;
  private collectBlocksToProcessMetricInterval: number;
  private collectBlocksToProcessMetricTimer: NodeJS.Timer = null;

  private get lastBlockNumberToProcess(): number {
    return this.toBlock ? Math.min(this.toBlock, this.lastBlockchainBlockNumber) : this.lastBlockchainBlockNumber;
  }

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly dataFetchService: DataFetcherService,
    @InjectMetric(BLOCKCHAIN_BLOCKS_METRIC_NAME)
    private readonly blockchainBlocksMetric: Gauge,
    @InjectMetric(BLOCKS_TO_PROCESS_METRIC_NAME)
    private readonly blocksToProcessMetric: Gauge,
    @InjectMetric(GET_BLOCK_INFO_DURATION_METRIC_NAME)
    private readonly getBlockInfoDurationMetric: Histogram<ProcessingActionMetricLabel>,
    configService: ConfigService
  ) {
    this.batchSize = configService.get<number>("blocks.blocksProcessingBatchSize");
    this.fromBlock = configService.get<number>("blocks.fromBlock");
    this.toBlock = configService.get<number>("blocks.toBlock");
    this.logger = new Logger(BlockWatcher.name);
    this.collectBlocksToProcessMetricInterval = configService.get<number>(
      "metrics.collectBlocksToProcessMetricInterval"
    );
  }

  public async getNextBlocksToProcess(lastDbBlockNumber: number = null): Promise<BlockData[]> {
    if (this.lastBlockchainBlockNumber === null) {
      return [];
    }

    this.nextBlockNumberToProcess = lastDbBlockNumber == null ? this.fromBlock : lastDbBlockNumber + 1;
    const lastBlockNumberToProcess = this.lastBlockNumberToProcess;

    if (this.nextBlockNumberToProcess < this.fromBlock || this.nextBlockNumberToProcess > lastBlockNumberToProcess) {
      return [];
    }

    const endBlockNumberToProcess = Math.min(
      lastBlockNumberToProcess,
      this.nextBlockNumberToProcess + this.batchSize - 1
    );
    return this.getBlockInfoListFromBlockchain(this.nextBlockNumberToProcess, endBlockNumberToProcess);
  }

  private setBlocksToProcessMetric(): void {
    const lastBlockNumberToProcess = this.lastBlockNumberToProcess;
    if (
      this.nextBlockNumberToProcess &&
      this.nextBlockNumberToProcess >= this.fromBlock &&
      this.nextBlockNumberToProcess <= lastBlockNumberToProcess
    ) {
      this.blocksToProcessMetric.set(lastBlockNumberToProcess - this.nextBlockNumberToProcess + 1);
    } else {
      this.blocksToProcessMetric.set(0);
    }
  }

  private getBlockInfoListFromBlockchain(startBlockNumber: number, endBlockNumber: number): Promise<BlockData[]> {
    const getBlockInfoTasks = [];
    for (let blockNumber = startBlockNumber; blockNumber <= endBlockNumber; blockNumber++) {
      getBlockInfoTasks.push(this.getBlockInfoFromBlockChain(blockNumber));
    }
    return Promise.all(getBlockInfoTasks);
  }

  private async getBlockInfoFromBlockChain(blockNumber: number): Promise<BlockData> {
    this.logger.debug({ message: "Getting block from the blockchain", blockNumber });

    const stopGetBlockInfoDurationMetric = this.getBlockInfoDurationMetric.startTimer();
    const blockData = await this.dataFetchService.getBlockData(blockNumber);
    stopGetBlockInfoDurationMetric();

    return blockData;
  }

  public async onModuleInit(): Promise<void> {
    this.lastBlockchainBlockNumber = await this.blockchainService.getBlockNumber();

    this.blockchainBlocksMetric.set(this.lastBlockchainBlockNumber);
    this.logger.debug(`Last block number is set to: ${this.lastBlockchainBlockNumber}`);

    this.blockchainService.on("block", (blockNumber) => {
      this.lastBlockchainBlockNumber = Math.max(this.lastBlockchainBlockNumber, blockNumber);
      this.blockchainBlocksMetric.set(this.lastBlockchainBlockNumber);
      this.logger.debug(`Last block number is updated to: ${this.lastBlockchainBlockNumber}`);
    });

    this.collectBlocksToProcessMetricTimer = setInterval(() => {
      this.setBlocksToProcessMetric();
    }, this.collectBlocksToProcessMetricInterval);
  }

  public onModuleDestroy() {
    clearInterval(this.collectBlocksToProcessMetricTimer as unknown as number);
  }
}
