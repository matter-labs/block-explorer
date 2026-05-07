import { PipeTransform, Injectable, InternalServerErrorException } from "@nestjs/common";
import { UserParam } from "../../user/user.decorator";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import { PrividiumApiError } from "../../errors/prividiumApiError";

export interface UserWithRoles extends UserParam {
  roles: string[];
  hasFullReadAccess: boolean;
}

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

export function parseUserProfile(data: unknown): { roles: string[]; hasFullReadAccess: boolean } {
  const result = userProfileSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid user profile response: ${JSON.stringify(result.error)}`);
  }
  const roles = result.data.roles.map((r) => r.roleName);
  const hasFullReadAccess = result.data.roles.some((r) =>
    r.systemPermissions?.some((p) => READ_ALL_PERMISSIONS.has(p))
  );
  return { roles, hasFullReadAccess };
}

function throwError(): never {
  throw new InternalServerErrorException("Authentication failed");
}

@Injectable()
export class AddUserRolesPipe implements PipeTransform<UserParam | null, Promise<UserWithRoles | null>> {
  constructor(private config: ConfigService) {}

  async transform(value: UserParam | null): Promise<UserWithRoles | null> {
    if (value === null) return null;

    const response = await fetch(new URL("/api/profiles/me", this.config.get("prividium.permissionsApiUrl")), {
      headers: { Authorization: `Bearer ${value.token}` },
    }).catch(throwError);

    if (response.status !== 200) {
      throw new PrividiumApiError("Authentication failed", 401);
    }

    const json = await response.json().catch(throwError);
    const profile = (() => {
      try {
        return parseUserProfile(json);
      } catch {
        return throwError();
      }
    })();

    return {
      ...value,
      roles: profile.roles,
      hasFullReadAccess: profile.hasFullReadAccess,
    };
  }
}
