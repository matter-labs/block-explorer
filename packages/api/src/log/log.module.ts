import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LogService } from "./log.service";
import { Log } from "./log.entity";
import { LOG_VISIBILITY_POLICY } from "./log.tokens";
import { makePrividiumToggleProvider } from "../prividium/prividium-provider.factory";
import { NoopLogVisibilityPolicy, RuleBasedLogVisibilityPolicy } from "../prividium/policies/log-visibility.policy";
import { PrividiumModule } from "../prividium/prividium.module";

@Module({
  imports: [TypeOrmModule.forFeature([Log]), PrividiumModule],
  providers: [
    LogService,
    makePrividiumToggleProvider(LOG_VISIBILITY_POLICY, NoopLogVisibilityPolicy, RuleBasedLogVisibilityPolicy),
  ],
  exports: [LogService],
})
export class LogModule {}
