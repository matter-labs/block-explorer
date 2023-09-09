import { Module } from "@nestjs/common";
import { TransactionModule } from "../../transaction/transaction.module";
import { TransactionController } from "./transaction.controller";

@Module({
  imports: [TransactionModule],
  controllers: [TransactionController],
})
export class ApiTransactionModule {}
