import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";
import { JsonRpcHealthIndicator } from "./jsonRpcProvider.health";

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [JsonRpcHealthIndicator],
})
export class HealthModule {}
