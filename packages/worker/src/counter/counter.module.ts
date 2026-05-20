import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CounterService } from "./counter.service";
import { MonthlyActiveAddressCounterWorker } from "./monthlyActiveAddressCounter.worker";
import {
  Transaction,
  TransactionReceipt,
  Transfer,
  Counter,
  CounterState,
  IndexerState,
  MonthlyActiveAddress,
} from "../entities";
import {
  CounterRepository,
  CounterStateRepository,
  IndexerStateRepository,
  MonthlyActiveAddressRepository,
} from "../repositories";
import { getCounterWorkerProvider } from "./counter.utils";
import { UnitOfWorkModule } from "../unitOfWork";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      TransactionReceipt,
      Transfer,
      Counter,
      CounterState,
      IndexerState,
      MonthlyActiveAddress,
    ]),
    UnitOfWorkModule,
  ],
  providers: [
    CounterStateRepository,
    CounterRepository,
    IndexerStateRepository,
    MonthlyActiveAddressRepository,
    getCounterWorkerProvider("CounterWorker<Transaction>", Transaction, [["from|to"]]),
    getCounterWorkerProvider("CounterWorker<Transfer>", Transfer, [
      ["tokenAddress"],
      ["from|to"],
      ["tokenAddress", "from|to"],
    ]),
    MonthlyActiveAddressCounterWorker,
    CounterService,
  ],
  exports: [CounterService],
})
export class CounterModule {}
