import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StatsController } from "./stats.controller";
import { BlockModule } from "../block/block.module";
import { TransactionModule } from "../transaction/transaction.module";
import { MonthlyActiveAddressCount } from "./monthlyActiveAddressCount.entity";
import { MonthlyActiveAddressService } from "./monthlyActiveAddress.service";

@Module({
  imports: [BlockModule, TransactionModule, TypeOrmModule.forFeature([MonthlyActiveAddressCount])],
  controllers: [StatsController],
  providers: [MonthlyActiveAddressService],
})
export class StatsModule {}
