import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Gauge } from "prom-client";
import { BlockchainService } from "./blockchain/blockchain.service";
import { BlockRepository, IndexerStateRepository } from "./repositories";
import { BLOCKCHAIN_BLOCKS_METRIC_NAME, BLOCKS_TO_PROCESS_METRIC_NAME, MISSING_BLOCKS_METRIC_NAME } from "./metrics";

@Injectable()
export class IndexerMetricsService implements OnModuleInit, OnModuleDestroy {
  private lastBlockchainBlockNumber: number = null;
  private readonly logger: Logger;
  private readonly toBlock: number;
  private readonly collectBlocksToProcessMetricInterval: number;
  private readonly missingBlocksMetricEnabled: boolean;
  private readonly missingBlocksMetricInterval: number;
  private collectBlocksToProcessMetricTimer: NodeJS.Timer = null;
  private missingBlocksMetricTimer: NodeJS.Timer = null;

  public constructor(
    private readonly blockRepository: BlockRepository,
    private readonly indexerStateRepository: IndexerStateRepository,
    private readonly blockchainService: BlockchainService,
    @InjectMetric(BLOCKCHAIN_BLOCKS_METRIC_NAME)
    private readonly blockchainBlocksMetric: Gauge,
    @InjectMetric(BLOCKS_TO_PROCESS_METRIC_NAME)
    private readonly blocksToProcessMetric: Gauge,
    @InjectMetric(MISSING_BLOCKS_METRIC_NAME)
    private readonly missingBlocksMetric: Gauge,
    configService: ConfigService
  ) {
    this.logger = new Logger(IndexerMetricsService.name);
    this.toBlock = configService.get<number>("blocks.toBlock");
    this.collectBlocksToProcessMetricInterval = configService.get<number>(
      "metrics.collectBlocksToProcessMetricInterval"
    );
    this.missingBlocksMetricEnabled = !configService.get<boolean>("metrics.missingBlocks.disabled");
    this.missingBlocksMetricInterval = configService.get<number>("metrics.missingBlocks.interval");
  }

  private async setBlocksToProcessMetric(): Promise<void> {
    if (this.lastBlockchainBlockNumber == null) {
      return;
    }
    const lastBlockNumberToProcess =
      this.toBlock != null ? Math.min(this.toBlock, this.lastBlockchainBlockNumber) : this.lastBlockchainBlockNumber;
    const lastReadyBlockNumber = await this.indexerStateRepository.getLastReadyBlockNumber();
    this.blocksToProcessMetric.set(Math.max(0, lastBlockNumberToProcess - lastReadyBlockNumber));
  }

  private async updateMissingBlocksMetric(): Promise<void> {
    const lastReadyBlockNumber = await this.indexerStateRepository.getLastReadyBlockNumber();
    const missingBlocksCount = await this.blockRepository.getMissingBlocksCount(lastReadyBlockNumber);
    this.missingBlocksMetric.set(missingBlocksCount);
  }

  public async onModuleInit(): Promise<void> {
    this.lastBlockchainBlockNumber = await this.blockchainService.getBlockNumber();
    this.blockchainBlocksMetric.set(this.lastBlockchainBlockNumber);
    this.logger.debug(`Last block number is set to: ${this.lastBlockchainBlockNumber}`);

    this.blockchainService.on("block", (blockNumber) => {
      this.lastBlockchainBlockNumber = blockNumber || this.lastBlockchainBlockNumber;
      this.blockchainBlocksMetric.set(this.lastBlockchainBlockNumber);
      this.logger.debug(`Last block number is updated to: ${this.lastBlockchainBlockNumber}`);
    });

    this.collectBlocksToProcessMetricTimer = setInterval(() => {
      this.setBlocksToProcessMetric();
    }, this.collectBlocksToProcessMetricInterval);

    if (this.missingBlocksMetricEnabled) {
      this.missingBlocksMetricTimer = setInterval(() => {
        this.updateMissingBlocksMetric();
      }, this.missingBlocksMetricInterval);
    }
  }

  public onModuleDestroy() {
    clearInterval(this.collectBlocksToProcessMetricTimer as unknown as number);
    if (this.missingBlocksMetricEnabled) {
      clearInterval(this.missingBlocksMetricTimer as unknown as number);
    }
  }
}
