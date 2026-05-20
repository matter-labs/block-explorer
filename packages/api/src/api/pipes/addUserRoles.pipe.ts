import { PipeTransform, Injectable, BadGatewayException } from "@nestjs/common";
import { UserParam } from "../../user/user.decorator";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import { PrividiumApiError } from "../../errors/prividiumApiError";

type Permissions = {
  hasFullReadAccess: boolean;
  hasAdminRead: boolean;
};

export type UserWithPermissions = UserParam & Permissions;

// Permissions that grant unrestricted read access to all on-chain data in the explorer.
export const READ_ALL_PERMISSIONS = new Set(["full_read_access", "full_sequencer_rpc_access"]);

const userProfileSchema = z.object({
  roles: z.array(
    z.object({
      roleName: z.string(),
      systemPermissions: z.array(z.string()).optional(),
    })
  ),
});

export function parseUserProfile(data: unknown): Permissions {
  const result = userProfileSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid user profile response: ${JSON.stringify(result.error)}`);
  }
  const hasFullReadAccess = result.data.roles.some((r) =>
    r.systemPermissions?.some((p) => READ_ALL_PERMISSIONS.has(p))
  );
  const hasAdminRead = result.data.roles.some((r) => r.systemPermissions?.includes("admin_read"));
  return { hasFullReadAccess, hasAdminRead };
}

function throwUpstreamError(): never {
  throw new BadGatewayException("Auth service unavailable");
}

@Injectable()
export class AddUserRolesPipe implements PipeTransform<UserParam | null, Promise<UserWithPermissions | null>> {
  constructor(private config: ConfigService) {}

  async transform(value: UserParam | null): Promise<UserWithPermissions | null> {
    if (value === null) return null;

    const response = await fetch(new URL("/api/profiles/me", this.config.get("prividium.permissionsApiUrl")), {
      headers: { Authorization: `Bearer ${value.token}` },
    }).catch(throwUpstreamError);

    if (response.status === 401) {
      throw new PrividiumApiError("Authentication failed", 401);
    }

    if (response.status !== 200) {
      throwUpstreamError();
    }

    const json = await response.json().catch(throwUpstreamError);
    const profile = (() => {
      try {
        return parseUserProfile(json);
      } catch {
        return throwUpstreamError();
      }
    })();

    return {
      ...value,
      hasFullReadAccess: profile.hasFullReadAccess,
      hasAdminRead: profile.hasAdminRead,
    };
  }
}
