import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LogService } from "./log.service";
import { Log } from "./log.entity";

import { createPrividiumToggleProvider } from "../prividium/prividium-provider.factory";
import { LogVisibilityPolicy, RuleBasedLogVisibilityPolicy } from "../prividium/policies/log-visibility.policy";
import { PrividiumModule } from "../prividium/prividium.module";

@Module({
  imports: [TypeOrmModule.forFeature([Log]), PrividiumModule],
  providers: [LogService, createPrividiumToggleProvider(LogVisibilityPolicy, RuleBasedLogVisibilityPolicy)],
  exports: [LogService],
})
export class LogModule {}
