import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransferService } from "./transfer.service";
import { Transfer } from "./transfer.entity";
import { AddressTransfer } from "./addressTransfer.entity";
import { BaseTokenModule } from "src/base_token/base_token.module";

@Module({
  imports: [TypeOrmModule.forFeature([Transfer, AddressTransfer]), BaseTokenModule],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
