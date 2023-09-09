import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BalanceService } from "./balance.service";
import { Balance } from "./balance.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Balance])],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
