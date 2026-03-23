import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LogService } from "./log.service";
import { Log } from "./log.entity";
import { VisibleLog } from "./visibleLog.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Log, VisibleLog])],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
