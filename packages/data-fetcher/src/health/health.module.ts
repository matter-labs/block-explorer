import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HttpModule } from "@nestjs/axios";
import { HealthController } from "./health.controller";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";

@Module({
  controllers: [HealthController],
  imports: [TerminusModule, HttpModule],
  providers: [JsonRpcHealthIndicator],
})
export class HealthModule {}
