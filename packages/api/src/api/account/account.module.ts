import { Module } from "@nestjs/common";
import { TransactionModule } from "../../transaction/transaction.module";
import { TransferModule } from "../../transfer/transfer.module";
import { BlockModule } from "../../block/block.module";
import { BalanceModule } from "../../balance/balance.module";
import { AccountController } from "./account.controller";

@Module({
  imports: [BlockModule, TransactionModule, TransferModule, BalanceModule],
  controllers: [AccountController],
})
export class ApiAccountModule {}
