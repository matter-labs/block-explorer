import { PipeTransform, Injectable, BadGatewayException } from "@nestjs/common";
import { UserParam } from "../../user/user.decorator";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import { PrividiumApiError } from "../../errors/prividiumApiError";
import { NO_WALLET_VIEWER } from "../../common/constants";

type Permissions = {
  hasFullReadAccess: boolean;
  hasAdminRead: boolean;
  hasFullWriteAccess: boolean;
};

export type UserWithPermissions = UserParam & Permissions;

export const ADMIN_READ_PERMISSION = "admin_read";
// Permissions that allow write actions in the explorer, such as contract verification.
export const WRITE_PERMISSIONS = new Set(["full_sequencer_rpc_access", "admin_write"]);
// Permissions that grant unrestricted read access to all on-chain data in the explorer.
export const READ_ALL_PERMISSIONS = new Set(["full_read_access", ADMIN_READ_PERMISSION, ...WRITE_PERMISSIONS]);

const userProfileSchema = z.object({
  roles: z.array(
    z.object({
      roleName: z.string(),
      systemPermissions: z.array(z.string()).optional(),
      organizationId: z.string().nullish(),
    })
  ),
});

const userProfileWalletsSchema = z.object({
  wallets: z.array(z.object({ walletAddress: z.string() })),
});

export function parseUserProfile(data: unknown): Permissions {
  const result = userProfileSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid user profile response: ${JSON.stringify(result.error)}`);
  }
  // Organization-owned roles only grant access within that organization, which the explorer cannot scope to,
  // so only zone-level roles count. A missing organizationId means a permissions API without organization roles.
  const zoneRoles = result.data.roles.filter((r) => r.organizationId == null);
  const hasFullReadAccess = zoneRoles.some((r) => r.systemPermissions?.some((p) => READ_ALL_PERMISSIONS.has(p)));
  const hasAdminRead = zoneRoles.some((r) => r.systemPermissions?.includes(ADMIN_READ_PERMISSION));
  const hasFullWriteAccess = zoneRoles.some((r) => r.systemPermissions?.some((p) => WRITE_PERMISSIONS.has(p)));
  return { hasFullReadAccess, hasAdminRead, hasFullWriteAccess };
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
    const walletsResult = userProfileWalletsSchema.safeParse(json);
    if (!walletsResult.success) {
      throwUpstreamError();
    }
    const wallets = walletsResult.data.wallets.map((w) => w.walletAddress);

    // Wallets can be removed from the user after login, so the selected one must still be in the live list.
    if (
      value.address &&
      value.address !== NO_WALLET_VIEWER &&
      !wallets.some((w) => w.toLowerCase() === value.address.toLowerCase())
    ) {
      throw new PrividiumApiError("Authentication failed", 401);
    }

    return {
      ...value,
      wallets,
      hasFullReadAccess: profile.hasFullReadAccess,
      hasAdminRead: profile.hasAdminRead,
      hasFullWriteAccess: profile.hasFullWriteAccess,
    };
  }
}
