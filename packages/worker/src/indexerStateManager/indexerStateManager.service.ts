import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { BlockRepository, IndexerStateRepository } from "../repositories";
import waitFor from "../utils/waitFor";
import { Worker } from "../common/worker";
import { BLOCKS_REVERT_DETECTED_EVENT } from "../constants";

@Injectable()
export class IndexerStateManagerService extends Worker {
  private readonly logger: Logger;
  private readonly pollingInterval: number;
  private readonly disableBlocksRevert: boolean;

  public constructor(
    private readonly blockRepository: BlockRepository,
    private readonly indexerStateRepository: IndexerStateRepository,
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService
  ) {
    super();
    this.pollingInterval = configService.get<number>("blocks.enqueuerPollingInterval");
    this.disableBlocksRevert = configService.get<boolean>("blocks.disableBlocksRevert");
    this.logger = new Logger(IndexerStateManagerService.name);
  }

  protected async runProcess(): Promise<void> {
    try {
      await this.advanceLastReadyBlockNumber();
    } catch (error) {
      this.logger.error({ message: "Error while advancing last ready block number", stack: error.stack });
    }
    await waitFor(() => !this.currentProcessPromise, this.pollingInterval);
    if (!this.currentProcessPromise) {
      return;
    }
    return this.runProcess();
  }

  private async advanceLastReadyBlockNumber(): Promise<void> {
    const lastReadyBlockNumber = await this.indexerStateRepository.getLastReadyBlockNumber();
    const { firstIncorrectBlockNumber, lastCorrectBlockNumber } =
      await this.blockRepository.getStateAboveLastReadyBlock(lastReadyBlockNumber);

    if (
      firstIncorrectBlockNumber !== null &&
      lastCorrectBlockNumber !== null &&
      firstIncorrectBlockNumber - lastCorrectBlockNumber === 1
    ) {
      this.logger.warn({
        message: "Blocks revert detected",
        detectedIncorrectBlockNumber: firstIncorrectBlockNumber,
      });
      if (!this.disableBlocksRevert) {
        this.eventEmitter.emit(BLOCKS_REVERT_DETECTED_EVENT, {
          detectedIncorrectBlockNumber: firstIncorrectBlockNumber,
        });
      }
      return;
    }

    if (lastCorrectBlockNumber === null || lastCorrectBlockNumber <= lastReadyBlockNumber) {
      return;
    }
    this.logger.debug(`Advancing last ready block number from ${lastReadyBlockNumber} to ${lastCorrectBlockNumber}`);
    await this.indexerStateRepository.setLastReadyBlockNumber(lastCorrectBlockNumber);
  }
}
