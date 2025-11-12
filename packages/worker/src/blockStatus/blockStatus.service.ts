import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LessThan } from "typeorm";
import { BlockchainService } from "../blockchain";
import { BlockRepository } from "../repositories";
import { BlockStatus } from "../entities";
import waitFor from "../utils/waitFor";
import { Worker } from "../common/worker";

@Injectable()
export class BlockStatusService extends Worker {
  private readonly logger: Logger;
  private readonly pollingInterval: number;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly blockRepository: BlockRepository,
    configService: ConfigService
  ) {
    super();
    this.pollingInterval = configService.get<number>("blocks.statusCheckPollingInterval");
    this.logger = new Logger(BlockStatusService.name);
  }

  protected async runProcess(): Promise<void> {
    try {
      await this.updateBlocksStatus("finalized");
      await this.updateBlocksStatus("safe");
    } catch (error) {
      this.logger.error({
        message: "Error while updating blocks status",
        stack: error.stack,
      });
    }
    await waitFor(() => !this.currentProcessPromise, this.pollingInterval);
    if (!this.currentProcessPromise) {
      return;
    }
    return this.runProcess();
  }

  private async updateBlocksStatus(status: "safe" | "finalized"): Promise<void> {
    const latestBlockByStatus = await this.blockchainService.getBlock(status);
    if (!latestBlockByStatus) {
      return;
    }
    const blockStatus = status === "safe" ? BlockStatus.Committed : BlockStatus.Executed;
    const firstDbBlockWithSmallerStatus = await this.blockRepository.getBlock({
      where: {
        status: LessThan(blockStatus),
      },
      select: {
        number: true,
      },
      order: {
        number: "ASC",
      },
    });
    if (!firstDbBlockWithSmallerStatus) {
      return;
    }
    const updateFrom = firstDbBlockWithSmallerStatus.number;
    const updateTo = latestBlockByStatus.number;
    this.logger.debug(`Updating blocks with status = ${blockStatus} from ${updateFrom} to ${updateTo}`);
    await this.blockRepository.updateByRange(updateFrom, updateTo, { status: blockStatus });
  }
}
