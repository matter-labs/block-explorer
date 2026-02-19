import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";
import { TransactionReceiptService } from "./transactionReceipt.service";
import { InternalTransactionService } from "./internalTransaction.service";
import { Transaction } from "./entities/transaction.entity";
import { AddressTransaction } from "./entities/addressTransaction.entity";
import { TransactionReceipt } from "./entities/transactionReceipt.entity";
import { InternalTransaction } from "./entities/internalTransaction.entity";
import { AddressInternalTransaction } from "./entities/addressInternalTransaction.entity";
import { Address } from "../address/address.entity";
import { TransferModule } from "../transfer/transfer.module";
import { CounterModule } from "../counter/counter.module";
import { LogModule } from "../log/log.module";
import { Log } from "../log/log.entity";
import { Block } from "../block/block.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      AddressTransaction,
      TransactionReceipt,
      InternalTransaction,
      AddressInternalTransaction,
      Block,
      Log,
      Address,
    ]),
    TransferModule,
    LogModule,
    CounterModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionReceiptService, InternalTransactionService],
  exports: [TransactionService, TransactionReceiptService, InternalTransactionService],
})
export class TransactionModule {}
