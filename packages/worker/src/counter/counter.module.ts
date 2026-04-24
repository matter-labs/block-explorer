import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CounterService } from "./counter.service";
import { Transaction, TransactionReceipt, Transfer, Counter, CounterState, IndexerState } from "../entities";
import { CounterRepository, CounterStateRepository, IndexerStateRepository } from "../repositories";
import { getCounterWorkerProvider } from "./counter.utils";
import { UnitOfWorkModule } from "../unitOfWork";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionReceipt, Transfer, Counter, CounterState, IndexerState]),
    UnitOfWorkModule,
  ],
  providers: [
    CounterStateRepository,
    CounterRepository,
    IndexerStateRepository,
    getCounterWorkerProvider("CounterWorker<Transaction>", Transaction, [["from|to"]]),
    getCounterWorkerProvider("CounterWorker<Transfer>", Transfer, [
      ["tokenAddress"],
      ["from|to"],
      ["tokenAddress", "from|to"],
    ]),
    CounterService,
  ],
  exports: [CounterService],
})
export class CounterModule {}
