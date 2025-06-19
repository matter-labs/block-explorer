import { DynamicModule, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";
import { TransactionReceiptService } from "./transactionReceipt.service";
import { Transaction } from "./entities/transaction.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { TransactionReceipt } from "./entities/transactionReceipt.entity";
import { Batch } from "../batch/batch.entity";
import { TransferModule } from "../transfer/transfer.module";
import { CounterModule } from "../counter/counter.module";
import { LogModule } from "../log/log.module";
import { Log } from "../log/log.entity";
import { PrividiumTransactionController } from "./prividium-transaction.controller";
import { BlockModule } from "../block/block.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, AddressTransaction, TransactionReceipt, Batch, Log]),
    TransferModule,
    LogModule,
    CounterModule,
  ],
  providers: [TransactionService, TransactionReceiptService],
  exports: [TransactionService, TransactionReceiptService],
})
export class TransactionModule {
  static forRoot(prividium: boolean): DynamicModule {
    return {
      module: TransactionModule,
      imports: prividium ? [BlockModule] : [],
      controllers: prividium ? [PrividiumTransactionController] : [TransactionController],
      providers: [
        {
          provide: "TRANSACTION_MODULE_BASE",
          useValue: TransactionController,
        },
      ],
    };
  }
}
