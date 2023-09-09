import { Injectable } from "@nestjs/common";
import { Worker } from "../common/worker";
import { CountableEntity } from "../entities";
import waitFor from "../utils/waitFor";
import { CounterProcessor } from "./counter.processor";

@Injectable()
export class CounterWorker<T extends CountableEntity> extends Worker {
  public constructor(private readonly counterProcessor: CounterProcessor<T>, private readonly pollingInterval: number) {
    super();
  }

  protected async runProcess(): Promise<void> {
    const isNextRecordsBatchProcessed = await this.counterProcessor.processNextRecordsBatch();
    if (!isNextRecordsBatchProcessed) {
      await waitFor(() => !this.currentProcessPromise, this.pollingInterval);
    }
    if (!this.currentProcessPromise) {
      return;
    }
    return this.runProcess();
  }

  public revert(lastCorrectBlockNumber: number): Promise<void> {
    return this.counterProcessor.revert(lastCorrectBlockNumber);
  }
}
