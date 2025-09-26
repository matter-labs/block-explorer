import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "../common/worker";
import waitFor from "../utils/waitFor";
import { BlockStatus } from "../entities";
import { BalanceService } from "./balance.service";
import { BlockRepository } from "../repositories/block.repository";

@Injectable()
export class BalancesCleanerService extends Worker {
  private readonly deleteBalancesInterval: number;

  public constructor(
    private readonly balanceService: BalanceService,
    private readonly blockRepository: BlockRepository,
    configService: ConfigService
  ) {
    super();
    this.deleteBalancesInterval = configService.get<number>("balances.deleteBalancesInterval");
  }

  protected async runProcess(): Promise<void> {
    const lastVerifiedBlock = await this.blockRepository.getBlock({
      where: {
        status: BlockStatus.Executed,
      },
      select: {
        number: true,
      },
    });
    const lastVerifiedBlockNumber = lastVerifiedBlock?.number || 0;
    const lastRunBlockNumber = await this.balanceService.getDeleteBalancesFromBlockNumber();

    if (lastVerifiedBlockNumber > lastRunBlockNumber) {
      await this.balanceService.deleteOldBalances(lastRunBlockNumber, lastVerifiedBlockNumber);
      await this.balanceService.deleteZeroBalances(lastRunBlockNumber, lastVerifiedBlockNumber);
      await this.balanceService.setDeleteBalancesFromBlockNumber(lastVerifiedBlockNumber);
    }

    await waitFor(() => !this.currentProcessPromise, this.deleteBalancesInterval);
    if (!this.currentProcessPromise) {
      return;
    }

    return this.runProcess();
  }
}
