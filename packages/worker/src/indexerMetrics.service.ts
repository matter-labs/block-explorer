import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Gauge } from "prom-client";
import { ChainTipTracker } from "./chainTipTracker.service";
import { BlockRepository, IndexerStateRepository } from "./repositories";
import { BLOCKCHAIN_BLOCKS_METRIC_NAME, BLOCKS_TO_PROCESS_METRIC_NAME, MISSING_BLOCKS_METRIC_NAME } from "./metrics";

@Injectable()
export class IndexerMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly toBlock: number;
  private readonly collectBlocksToProcessMetricInterval: number;
  private readonly missingBlocksMetricEnabled: boolean;
  private readonly missingBlocksMetricInterval: number;
  private collectBlocksToProcessMetricTimer: NodeJS.Timer = null;
  private missingBlocksMetricTimer: NodeJS.Timer = null;

  public constructor(
    private readonly blockRepository: BlockRepository,
    private readonly indexerStateRepository: IndexerStateRepository,
    private readonly chainTipTracker: ChainTipTracker,
    @InjectMetric(BLOCKCHAIN_BLOCKS_METRIC_NAME)
    private readonly blockchainBlocksMetric: Gauge,
    @InjectMetric(BLOCKS_TO_PROCESS_METRIC_NAME)
    private readonly blocksToProcessMetric: Gauge,
    @InjectMetric(MISSING_BLOCKS_METRIC_NAME)
    private readonly missingBlocksMetric: Gauge,
    configService: ConfigService
  ) {
    this.toBlock = configService.get<number>("blocks.toBlock");
    this.collectBlocksToProcessMetricInterval = configService.get<number>(
      "metrics.collectBlocksToProcessMetricInterval"
    );
    this.missingBlocksMetricEnabled = !configService.get<boolean>("metrics.missingBlocks.disabled");
    this.missingBlocksMetricInterval = configService.get<number>("metrics.missingBlocks.interval");
  }

  private async setBlocksToProcessMetric(): Promise<void> {
    const chainTip = this.chainTipTracker.getLastBlockNumber();
    if (chainTip == null) {
      return;
    }
    this.blockchainBlocksMetric.set(chainTip);

    const lastBlockNumberToProcess = this.toBlock != null ? Math.min(this.toBlock, chainTip) : chainTip;
    const lastReadyBlockNumber = await this.indexerStateRepository.getLastReadyBlockNumber();
    this.blocksToProcessMetric.set(Math.max(0, lastBlockNumberToProcess - lastReadyBlockNumber));
  }

  private async updateMissingBlocksMetric(): Promise<void> {
    const lastReadyBlockNumber = await this.indexerStateRepository.getLastReadyBlockNumber();
    const missingBlocksCount = await this.blockRepository.getMissingBlocksCount(lastReadyBlockNumber);
    this.missingBlocksMetric.set(missingBlocksCount);
  }

  public onModuleInit(): void {
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
