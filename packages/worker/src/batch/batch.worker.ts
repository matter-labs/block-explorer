import waitFor from "../utils/waitFor";
import { Worker } from "../common/worker";
import { BatchProcessor } from "./batch.processor";

export class BatchWorker extends Worker {
  public constructor(private readonly batchProcessor: BatchProcessor, private readonly pollingInterval: number) {
    super();
  }

  public stop() {
    this.batchProcessor.resetState();
    return super.stop();
  }

  protected async runProcess(): Promise<void> {
    const isNextBatchProcessed = await this.batchProcessor.processNextBatch();
    if (!isNextBatchProcessed) {
      await waitFor(() => !this.currentProcessPromise, this.pollingInterval);
    }
    if (!this.currentProcessPromise) {
      return;
    }
    return this.runProcess();
  }
}
