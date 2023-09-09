export abstract class Worker {
  protected currentProcessPromise: Promise<void> = null;

  protected abstract runProcess(): Promise<void>;

  public async start() {
    if (!this.currentProcessPromise) {
      this.currentProcessPromise = this.runProcess();
    }
    return this.currentProcessPromise;
  }

  public async stop() {
    const stopPromise = this.currentProcessPromise;
    this.currentProcessPromise = null;
    return stopPromise;
  }
}
