import { Module } from "@nestjs/common";
import { MetricsModule } from "../metrics";
import { UnitOfWork } from "./unitOfWork.provider";

@Module({
  imports: [MetricsModule],
  providers: [UnitOfWork],
  exports: [UnitOfWork],
})
export class UnitOfWorkModule {}
