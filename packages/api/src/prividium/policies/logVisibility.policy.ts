import { Injectable } from "@nestjs/common";
import { Brackets, SelectQueryBuilder } from "typeorm";
import { zeroPadValue } from "ethers";

import { Log } from "../../log/log.entity";
import { hexTransformer } from "../../common/transformers/hex.transformer";
import { logQueryForDebug } from "./logVisibility.utils";
import {
  EventPermissionRule,
  PrividiumRulesService,
  TopicCondition,
  VisibilityContext,
} from "../prividium-rules.service";

export abstract class LogVisibilityPolicy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  apply(qb: SelectQueryBuilder<Log>, visibility?: VisibilityContext, byContract?: string): Promise<void> | void {
    return;
  }
}

@Injectable()
export class RuleBasedLogVisibilityPolicy implements LogVisibilityPolicy {
  constructor(private readonly rulesService: PrividiumRulesService) {}

  async apply(qb: SelectQueryBuilder<Log>, visibility?: VisibilityContext, byContract?: string): Promise<void> {
    if (!visibility) {
      return;
    }

    const user = visibility?.user;
    // Deny if no user or missing token
    if (!user || !user.token) {
      qb.andWhere("FALSE");
      return;
    }

    // Admin can view all events
    if (user.isAdmin) {
      return;
    }

    const rules = await this.rulesService.fetchEventPermissionRules(user.token);
    const filteredRules = this.filterByContract(rules, byContract);

    if (filteredRules.length === 0) {
      qb.andWhere("FALSE");
      return;
    }

    this.applyEventPermissionRules(qb, rules, user.address);
  }

  private applyEventPermissionRules(qb: SelectQueryBuilder<Log>, rules: EventPermissionRule[], userAddress: string) {
    const userAddressTopic = hexTransformer.to(zeroPadValue(userAddress, 32));

    qb.andWhere(
      new Brackets((outer) => {
        rules.forEach((rule, idx) => {
          const ruleBrackets = new Brackets((inner) => {
            // When contract is null when rules are applied per-contract
            if (rule.contractAddress !== null) {
              const addrParam = `rule_${idx}_addr`;
              inner.where(`log.address = :${addrParam}`, {
                [addrParam]: hexTransformer.to(rule.contractAddress),
              });
            }

            if (rule.topic0 !== null) {
              const t0Param = `rule_${idx}_t0`;
              inner.andWhere(`log.topics[1] = :${t0Param}`, {
                [t0Param]: hexTransformer.to(rule.topic0),
              });
            }

            const topicEntries: [TopicCondition | null, number][] = [
              [rule.topic1, 2],
              [rule.topic2, 3],
              [rule.topic3, 4],
            ];

            for (const [condition, pgIndex] of topicEntries) {
              if (condition === null) continue;

              const paramName = `rule_${idx}_t${pgIndex - 1}`;

              if (condition.type === "equalTo") {
                inner.andWhere(`log.topics[${pgIndex}] = :${paramName}`, {
                  [paramName]: hexTransformer.to(condition.value),
                });
              } else if (condition.type === "userAddress") {
                inner.andWhere(`log.topics[${pgIndex}] = :${paramName}`, {
                  [paramName]: userAddressTopic,
                });
              }
            }
          });

          if (idx === 0) {
            outer.where(ruleBrackets);
          } else {
            outer.orWhere(ruleBrackets);
          }
        });
      })
    );
  }

  private filterByContract(rules: EventPermissionRule[], contractAddress?: string) {
    if (!contractAddress) {
      return rules;
    }

    return rules.filter((r) => r.contractAddress.toLowerCase() === contractAddress.toLowerCase());
  }
}
