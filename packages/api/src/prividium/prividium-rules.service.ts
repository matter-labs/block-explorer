import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";

import { PrividiumApiError } from "../errors/prividiumApiError";
import { UserWithRoles } from "../api/pipes/addUserRoles.pipe";
import { EVENT_PERMISSION_RULES_FINGERPRINT } from "./constants";

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

@Injectable()
export class PrividiumRulesService {
  constructor(private readonly configService: ConfigService) {}

  async fetchEventPermissionRules(token: string): Promise<EventPermissionRule[]> {
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

    return parsed.data.rules as EventPermissionRule[];
  }
}
