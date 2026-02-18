import { Module } from "@nestjs/common";
import { PrividiumRulesService } from "./prividium-rules.service";
import { RuleBasedLogVisibilityPolicy } from "./policies/log-visibility.policy";

@Module({
  providers: [PrividiumRulesService, RuleBasedLogVisibilityPolicy],
  exports: [PrividiumRulesService, RuleBasedLogVisibilityPolicy],
})
export class PrividiumModule {}
