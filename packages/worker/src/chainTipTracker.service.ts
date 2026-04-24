import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { setTimeout } from "timers/promises";
import { BlockchainService } from "./blockchain/blockchain.service";

@Injectable()
export class ChainTipTracker implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger;
  private readonly pollingInterval: number;
  private lastBlockNumber: number | null = null;
  private stopped = false;
  private pollLoopPromise: Promise<void> = null;

  public constructor(private readonly blockchainService: BlockchainService, configService: ConfigService) {
    this.logger = new Logger(ChainTipTracker.name);
    this.pollingInterval = configService.get<number>("blocks.chainTipPollingInterval");
  }

  public getLastBlockNumber(): number | null {
    return this.lastBlockNumber;
  }

  public onModuleInit(): void {
    this.pollLoopPromise = this.pollLoop();
  }

  public async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    await this.pollLoopPromise;
  }

  private async pollLoop(): Promise<void> {
    while (!this.stopped) {
      try {
        this.lastBlockNumber = await this.blockchainService.getBlockNumber();
      } catch (error) {
        this.logger.warn({ message: "Failed to fetch chain tip", stack: error.stack });
      }
      await setTimeout(this.pollingInterval);
    }
  }
}
