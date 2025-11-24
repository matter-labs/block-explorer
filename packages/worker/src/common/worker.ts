import { Logger } from "@nestjs/common";

export abstract class Worker {
  private readonly workerLogger: Logger;

  protected currentProcessPromise: Promise<void> = null;

  protected abstract runProcess(): Promise<void>;

  public constructor() {
    this.workerLogger = new Logger(Worker.name);
  }

  public async start() {
    if (!this.currentProcessPromise) {
      this.currentProcessPromise = this.runProcess();
    }
    this.workerLogger.log(`Started worker ${this.constructor.name}`);
    return this.currentProcessPromise;
  }

  public async stop() {
    const stopPromise = this.currentProcessPromise;
    this.currentProcessPromise = null;
    this.workerLogger.log(`Stopping worker ${this.constructor.name}`);
    await stopPromise;
    this.workerLogger.log(`Stopped worker ${this.constructor.name}`);
    return stopPromise;
  }
}
