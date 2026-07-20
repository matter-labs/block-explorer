import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CounterWorker } from "./counter.worker";
import { MonthlyActiveAddressCounterWorker } from "./monthlyActiveAddressCounter.worker";
import { CounterRepository } from "../repositories";
import { Transaction, Transfer } from "../entities";

@Injectable()
export class CounterService {
  private readonly disableMonthlyActiveAddressCounting: boolean;

  public constructor(
    @Inject("CounterWorker<Transaction>")
    private readonly transactionsCounterWorker: CounterWorker<Transaction>,
    @Inject("CounterWorker<Transfer>")
    private readonly transfersCounterWorker: CounterWorker<Transfer>,
    private readonly monthlyActiveAddressCounterWorker: MonthlyActiveAddressCounterWorker,
    private readonly counterRepository: CounterRepository,
    configService: ConfigService
  ) {
    this.disableMonthlyActiveAddressCounting = configService.get<boolean>(
      "counters.disableMonthlyActiveAddressCounting"
    );
  }

  public async start() {
    const tasks: Promise<void>[] = [this.transactionsCounterWorker.start(), this.transfersCounterWorker.start()];
    if (!this.disableMonthlyActiveAddressCounting) {
      tasks.push(this.monthlyActiveAddressCounterWorker.start());
    }
    await Promise.all(tasks);
  }

  public async stop() {
    await Promise.all([
      this.transactionsCounterWorker.stop(),
      this.transfersCounterWorker.stop(),
      this.monthlyActiveAddressCounterWorker.stop(),
    ]);
  }

  public async revert(lastCorrectBlockNumber: number) {
    await Promise.all([
      this.transactionsCounterWorker.revert(lastCorrectBlockNumber),
      this.transfersCounterWorker.revert(lastCorrectBlockNumber),
      this.monthlyActiveAddressCounterWorker.revert(lastCorrectBlockNumber),
    ]);
    // removing all counters with count = 0.
    await this.counterRepository.delete({ count: 0 });
  }
}
