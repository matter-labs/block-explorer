import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LogService } from "./log.service";
import { Log } from "./log.entity";
import { LOG_VISIBILITY_POLICY, RuleBasedLogVisibilityPolicy, NoopLogVisibilityPolicy } from "./log.tokens";
import { makePrividiumToggleProvider } from "../prividium/prividium-provider.factory";
import { PrividiumRulesService } from "../prividium/prividium-rules.service";

@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  providers: [
    LogService,
    PrividiumRulesService,
    NoopLogVisibilityPolicy,
    RuleBasedLogVisibilityPolicy,
    makePrividiumToggleProvider(LOG_VISIBILITY_POLICY, NoopLogVisibilityPolicy, RuleBasedLogVisibilityPolicy),
  ],
  exports: [LogService],
})
export class LogModule {}
