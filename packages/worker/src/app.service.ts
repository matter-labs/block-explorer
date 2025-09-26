import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import { DataSource } from "typeorm";
import { BLOCKS_REVERT_DETECTED_EVENT } from "./constants";
import { BlocksRevertService } from "./blocksRevert";
import { BlockStatusService } from "./blockStatus";
import { BlockService } from "./block";
import { CounterService } from "./counter";
import { BalancesCleanerService } from "./balance";
import { TokenService } from "./token/token.service";
import { TokenOffChainDataSaverService } from "./token/tokenOffChainData/tokenOffChainDataSaver.service";
import runMigrations from "./utils/runMigrations";
import { SystemContractService } from "./contract/systemContract.service";

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger;
  private isHandlingBlocksRevert = false;

  public constructor(
    private readonly counterService: CounterService,
    private readonly blockService: BlockService,
    private readonly blocksRevertService: BlocksRevertService,
    private readonly blockStatusService: BlockStatusService,
    private readonly balancesCleanerService: BalancesCleanerService,
    private readonly tokenOffChainDataSaverService: TokenOffChainDataSaverService,
    private readonly tokenService: TokenService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly systemContractService: SystemContractService
  ) {
    this.logger = new Logger(AppService.name);
  }

  public onModuleInit() {
    runMigrations(this.dataSource, this.logger).then(() => {
      // TODO: adapt for ZKsync OS
      //this.systemContractService.addSystemContracts().then(() => {
      this.tokenService.addBaseToken();
      //});
      this.startWorkers();
    });
  }

  public onModuleDestroy() {
    this.stopWorkers();
  }

  @OnEvent(BLOCKS_REVERT_DETECTED_EVENT)
  protected async handleBlocksRevert({ detectedIncorrectBlockNumber }: { detectedIncorrectBlockNumber: number }) {
    if (this.isHandlingBlocksRevert) {
      return;
    }
    this.isHandlingBlocksRevert = true;

    this.logger.log("Stopping workers before blocks revert");
    await this.stopWorkers();

    this.logger.log("Reverting blocks");
    await this.blocksRevertService.handleRevert(detectedIncorrectBlockNumber);

    this.logger.log("Starting workers after blocks revert");
    this.startWorkers();

    this.isHandlingBlocksRevert = false;
  }

  private startWorkers() {
    const disableBlockStatusProcessing = this.configService.get<boolean>("blocks.disableBlockStatusProcessing");
    const disableCountersProcessing = this.configService.get<boolean>("counters.disableCountersProcessing");
    const disableOldBalancesCleaner = this.configService.get<boolean>("balances.disableOldBalancesCleaner");
    const enableTokenOffChainDataSaver = this.configService.get<boolean>("tokens.enableTokenOffChainDataSaver");
    const tasks = [this.blockService.start()];
    if (!disableBlockStatusProcessing) {
      tasks.push(this.blockStatusService.start());
    }
    if (!disableCountersProcessing) {
      tasks.push(this.counterService.start());
    }
    if (!disableOldBalancesCleaner) {
      tasks.push(this.balancesCleanerService.start());
    }
    if (enableTokenOffChainDataSaver) {
      tasks.push(this.tokenOffChainDataSaverService.start());
    }
    return Promise.all(tasks);
  }

  private stopWorkers() {
    return Promise.all([
      this.blockService.stop(),
      this.blockStatusService.stop(),
      this.counterService.stop(),
      this.balancesCleanerService.stop(),
      this.tokenOffChainDataSaverService.stop(),
    ]);
  }
}
