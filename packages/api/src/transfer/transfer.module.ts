import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransferService } from "./transfer.service";
import { Transfer } from "./transfer.entity";
import { AddressTransfer } from "./addressTransfer.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Transfer, AddressTransfer])],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
