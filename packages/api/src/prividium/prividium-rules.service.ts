import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";

import { PrividiumApiError } from "../errors/prividiumApiError";
import { UserWithRoles } from "../api/pipes/addUserRoles.pipe";

export type TopicCondition = { type: "equalTo"; value: string } | { type: "userAddress" };

export interface EventPermissionRule {
  contractAddress: string;
  topic0: string | null;
  topic1: TopicCondition | null;
  topic2: TopicCondition | null;
  topic3: TopicCondition | null;
}

export interface VisibilityContext {
  user?: UserWithRoles | null;
}

// TODO: Move to const/config
export const EVENT_PERMISSION_RULES_FINGERPRINT =
  "ffad968c66c9f519c2fe7b775b721e466bbf3c451194992c3c202f4b189b87c5" as const;

const topicConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("equalTo"), value: z.string() }),
  z.object({ type: z.literal("userAddress") }),
]);

const eventPermissionRuleSchema = z.object({
  contractAddress: z.string(),
  topic0: z.string().nullable(),
  topic1: topicConditionSchema.nullable(),
  topic2: topicConditionSchema.nullable(),
  topic3: topicConditionSchema.nullable(),
});

const eventPermissionRulesResponseSchema = z.object({
  fingerprint: z.literal(EVENT_PERMISSION_RULES_FINGERPRINT),
  rules: z.array(eventPermissionRuleSchema),
});

interface CachedRules {
  rules: EventPermissionRule[];
  fetchedAt: number;
}

@Injectable()
export class PrividiumRulesService {
  private readonly cacheTtlMs = 5 * 60 * 1000;
  private cache = new Map<string, CachedRules>();

  constructor(private readonly configService: ConfigService) {}

  async fetchEventPermissionRules(token: string): Promise<EventPermissionRule[]> {
    const cached = this.cache.get(token);
    if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs) {
      return cached.rules;
    }

    const permissionsApiUrl = this.configService.get<string>("prividium.permissionsApiUrl");

    let response: Response;
    try {
      response = await fetch(new URL("/api/check/event-permission-rules", permissionsApiUrl), {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new PrividiumApiError("Permission rules fetch failed", 500);
    }

    if (!response.ok) {
      throw new PrividiumApiError("Permission rules fetch failed", response.status);
    }

    const parsed = eventPermissionRulesResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new PrividiumApiError("Invalid permission rules response", 500);
    }

    const rules = parsed.data.rules as EventPermissionRule[];
    this.cache.set(token, { rules, fetchedAt: Date.now() });
    return rules;
  }
}
