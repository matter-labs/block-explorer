import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";
import { TransactionReceiptService } from "./transactionReceipt.service";
import { Transaction } from "./entities/transaction.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { TransactionReceipt } from "./entities/transactionReceipt.entity";
import { TransferModule } from "../transfer/transfer.module";
import { CounterModule } from "../counter/counter.module";
import { LogModule } from "../log/log.module";
import { Log } from "../log/log.entity";
import { Block } from "../block/block.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, AddressTransaction, TransactionReceipt, Block, Log]),
    TransferModule,
    LogModule,
    CounterModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionReceiptService],
  exports: [TransactionService, TransactionReceiptService],
})
export class TransactionModule {}
