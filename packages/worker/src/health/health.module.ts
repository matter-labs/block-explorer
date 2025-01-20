import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";
import { HttpModule } from "@nestjs/axios";

@Module({
  controllers: [HealthController],
  imports: [TerminusModule, HttpModule],
  providers: [JsonRpcHealthIndicator],
})
export class HealthModule {}
