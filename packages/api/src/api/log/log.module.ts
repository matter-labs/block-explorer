import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { LogController } from "./log.controller";
import { LogModule } from "../../log/log.module";

@Module({
  imports: [HttpModule, LogModule],
  controllers: [LogController],
})
export class ApiLogModule {}
