import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StatsController } from "./stats.controller";
import { BlockModule } from "../block/block.module";
import { Block } from "../block/block.entity";
import { TransactionModule } from "../transaction/transaction.module";
import { IndexerStateModule } from "../indexerState/indexerState.module";
import { MonthlyActiveAddressCount } from "./monthlyActiveAddressCount.entity";
import { MonthlyActiveAddressService } from "./monthlyActiveAddress.service";
import { MonthlyTransactionService } from "./monthlyTransaction.service";

@Module({
  imports: [
    BlockModule,
    TransactionModule,
    IndexerStateModule,
    TypeOrmModule.forFeature([MonthlyActiveAddressCount, Block]),
  ],
  controllers: [StatsController],
  providers: [MonthlyActiveAddressService, MonthlyTransactionService],
})
export class StatsModule {}
