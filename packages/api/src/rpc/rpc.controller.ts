import { Body, Controller, Header, Post, UnauthorizedException } from "@nestjs/common";
import { ApiExcludeController, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { swagger } from "../config/featureFlags";
import { PrividiumApiError } from "../errors/prividiumApiError";
import { User, UserParam } from "../user/user.decorator";

const entityName = "rpc";

@ApiTags("RPC BFF")
@ApiExcludeController(!swagger.bffEnabled)
@Controller(entityName)
export class RpcController {
  constructor(private readonly configService: ConfigService) {}

  // Prividium authorizes every RPC call against the caller and only the session holds the
  // user's permissions API token, so the app's RPC calls are made on its behalf here.
  @Post("")
  @Header("Content-Type", "application/json")
  @ApiOkResponse({ description: "JSON-RPC response returned by the permissions API" })
  public async proxy(@Body() body: unknown, @User() user: UserParam): Promise<unknown> {
    if (!user) {
      throw new UnauthorizedException({ message: "Unauthorized request" });
    }

    const response = await fetch(new URL("/rpc", this.configService.get("prividium.permissionsApiUrl")), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 401 || response.status === 403) {
      throw new PrividiumApiError("Invalid or expired token", 401);
    }

    // A JSON-RPC error is carried in a 2xx body, so any other status is a transport failure.
    // Without this an upstream 5xx is returned to the app as a 200 with a body ethers cannot parse.
    if (!response.ok) {
      throw new PrividiumApiError("Invalid response from permissions API", 502);
    }

    try {
      return await response.json();
    } catch {
      throw new PrividiumApiError("Invalid response from permissions API", 502);
    }
  }
}
