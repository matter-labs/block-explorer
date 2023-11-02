import { Module } from "@nestjs/common";
import { StatsController } from "./stats.controller";
import { TokenModule } from "../../token/token.module";

@Module({
  imports: [TokenModule],
  controllers: [StatsController],
})
export class ApiStatsModule {}
