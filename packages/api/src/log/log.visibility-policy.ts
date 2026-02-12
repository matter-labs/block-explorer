import { Injectable } from "@nestjs/common";
import { Brackets, SelectQueryBuilder } from "typeorm";
import { zeroPadValue } from "ethers";

import { Log } from "./log.entity";
import { TopicCondition, EventPermissionRule } from "./log.service";
import { hexTransformer } from "../common/transformers/hex.transformer";
import { VisibilityContext } from "../prividium/visibility/visibility.context";
import { PrividiumRulesService } from "../prividium/prividium-rules.service";

export interface LogVisibilityPolicy {
  apply(qb: SelectQueryBuilder<Log>, visibility?: VisibilityContext): Promise<void> | void;
}

@Injectable()
export class NoopLogVisibilityPolicy implements LogVisibilityPolicy {
  apply(): void {
    // intentionally no-op
  }
}

@Injectable()
export class RuleBasedLogVisibilityPolicy implements LogVisibilityPolicy {
  constructor(private readonly rulesService: PrividiumRulesService) {}

  async apply(qb: SelectQueryBuilder<Log>, visibility?: VisibilityContext): Promise<void> {
    if (visibility?.isAdmin) return;

    const effectiveVisibleBy = visibility?.userAddress;
    if (effectiveVisibleBy) {
      this.applyVisibleBy(qb, effectiveVisibleBy);
    }

    if (visibility?.token) {
      const rules = await this.rulesService.fetchEventPermissionRules(visibility.token);
      this.applyEventPermissionRules(qb, rules, visibility.userAddress);
    }
  }

  private applyVisibleBy(qb: SelectQueryBuilder<Log>, visibleBy: string) {
    qb.innerJoin("log.transaction", "transactions");
    const topic = zeroPadValue(visibleBy, 32);
    qb.andWhere(
      new Brackets((inner) => {
        inner.where(`log.topics[1] = :visibleByTopic`);
        inner.orWhere("log.topics[2] = :visibleByTopic");
        inner.orWhere("log.topics[3] = :visibleByTopic");
        inner.orWhere("transactions.from = :visibleBy");
      })
    );
    qb.setParameters({ visibleByTopic: hexTransformer.to(topic), visibleBy: hexTransformer.to(visibleBy) });
  }

  private applyEventPermissionRules(
    qb: SelectQueryBuilder<Log>,
    eventPermissionRules: EventPermissionRule[],
    eventPermissionUserAddress?: string
  ) {
    if (eventPermissionRules.length === 0) {
      qb.andWhere("FALSE");
      return;
    }

    qb.andWhere(
      new Brackets((outer) => {
        eventPermissionRules.forEach((rule, idx) => {
          const ruleBrackets = new Brackets((inner) => {
            const addrParam = `rule_${idx}_addr`;
            inner.where(`log.address = :${addrParam}`, {
              [addrParam]: hexTransformer.to(rule.contractAddress),
            });

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
                  [paramName]: hexTransformer.to(zeroPadValue(eventPermissionUserAddress, 32)),
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
}
