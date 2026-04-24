import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransferService } from "./transfer.service";
import { Transfer } from "./transfer.entity";
import { AddressTransfer } from "./addressTransfer.entity";
import { IndexerStateModule } from "../indexerState/indexerState.module";
@Module({
  imports: [TypeOrmModule.forFeature([Transfer, AddressTransfer]), IndexerStateModule],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
