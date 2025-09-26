import { Module } from "@nestjs/common";
import { StatsController } from "./stats.controller";
import { BlockModule } from "../block/block.module";
import { TransactionModule } from "../transaction/transaction.module";

@Module({
  imports: [BlockModule, TransactionModule],
  controllers: [StatsController],
})
export class StatsModule {}
