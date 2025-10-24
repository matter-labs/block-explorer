import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from "@nestjs/common";
import { UserParam } from "../../user/user.decorator";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";

export interface UserWithRoles extends UserParam {
  roles: string[];
  isAdmin: boolean;
}

@Injectable()
export class AddUserRolesPipe implements PipeTransform<UserParam | null, Promise<UserWithRoles | null>> {
  constructor(private config: ConfigService) {}

  async transform(value: UserParam | null, _metadata: ArgumentMetadata): Promise<UserWithRoles | null> {
    if (value === null) return null;

    const response = await fetch(new URL("/api/profiles/me", this.config.get("prividium.permissionsApiUrl")), {
      headers: { Authorization: `Bearer ${value.token}` },
    });
    const validatedData = z
      .object({
        roles: z.array(z.object({ roleName: z.string() })),
      })
      .safeParse(await response.json());

    const roles = validatedData.data.roles.map((r) => r.roleName);

    const isAdmin = roles.some((role) => role === this.config.get("prividium.adminRoleName"));

    return {
      ...value,
      roles,
      isAdmin,
    };
  }
}
