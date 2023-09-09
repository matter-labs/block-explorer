import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AddressController } from "./address.controller";
import { AddressService } from "./address.service";
import { BlockModule } from "../block/block.module";
import { Address } from "./address.entity";
import { LogModule } from "../log/log.module";
import { TokenModule } from "../token/token.module";
import { TransactionModule } from "../transaction/transaction.module";
import { BalanceModule } from "../balance/balance.module";
import { TransferModule } from "../transfer/transfer.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Address]),
    BlockModule,
    TransactionModule,
    TokenModule,
    LogModule,
    BalanceModule,
    TransferModule,
  ],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
