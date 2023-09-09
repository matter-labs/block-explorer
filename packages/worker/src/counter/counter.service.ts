import { Injectable, Inject } from "@nestjs/common";
import { CounterWorker } from "./counter.worker";
import { CounterRepository } from "../repositories";
import { Transaction, Transfer } from "../entities";

@Injectable()
export class CounterService {
  public constructor(
    @Inject("CounterWorker<Transaction>")
    private readonly transactionsCounterWorker: CounterWorker<Transaction>,
    @Inject("CounterWorker<Transfer>")
    private readonly transfersCounterWorker: CounterWorker<Transfer>,
    private readonly counterRepository: CounterRepository
  ) {}

  public async start() {
    await Promise.all([this.transactionsCounterWorker.start(), this.transfersCounterWorker.start()]);
  }

  public async stop() {
    await Promise.all([this.transactionsCounterWorker.stop(), this.transfersCounterWorker.stop()]);
  }

  public async revert(lastCorrectBlockNumber: number) {
    await Promise.all([
      this.transactionsCounterWorker.revert(lastCorrectBlockNumber),
      this.transfersCounterWorker.revert(lastCorrectBlockNumber),
    ]);
    // removing all counters with count = 0.
    await this.counterRepository.delete({ count: 0 });
  }
}
