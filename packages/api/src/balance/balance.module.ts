import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BalanceService } from "./balance.service";
import { Balance } from "./balance.entity";
import { IndexerStateModule } from "../indexerState/indexerState.module";

@Module({
  imports: [TypeOrmModule.forFeature([Balance]), IndexerStateModule],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
