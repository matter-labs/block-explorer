import { Module } from "@nestjs/common";
import { metricProviders } from "./metrics.provider";

@Module({
  providers: metricProviders,
  exports: metricProviders,
})
export class MetricsModule {}
