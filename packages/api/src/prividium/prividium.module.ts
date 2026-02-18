import { Module } from "@nestjs/common";
import { PrividiumRulesService } from "./prividium-rules.service";
import { NoopLogVisibilityPolicy, RuleBasedLogVisibilityPolicy } from "./policies/log-visibility.policy";

@Module({
  providers: [PrividiumRulesService, NoopLogVisibilityPolicy, RuleBasedLogVisibilityPolicy],
  exports: [PrividiumRulesService, NoopLogVisibilityPolicy, RuleBasedLogVisibilityPolicy],
})
export class PrividiumModule {}
