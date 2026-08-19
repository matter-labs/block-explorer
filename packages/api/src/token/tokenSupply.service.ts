import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserParam } from "../user/user.decorator";

// Selector of the standard ERC-20 `totalSupply()`.
const TOTAL_SUPPLY_SELECTOR = "0x18160ddd";

@Injectable()
export class TokenSupplyService {
  constructor(private readonly configService: ConfigService) {}

  // Prividium authorizes eth_call per user and rejects calls without a `from`, so the
  // browser cannot read totalSupply itself. Proxy it with the session's token instead.
  public async getTotalSupply(tokenAddress: string, user: UserParam): Promise<string | null> {
    if (!user) {
      return null;
    }

    const response = await fetch(new URL("/rpc", this.configService.get("prividium.permissionsApiUrl")), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: tokenAddress, from: user.address, data: TOTAL_SUPPLY_SELECTOR }, "latest"],
      }),
    }).catch(() => null);

    if (!response || response.status !== 200) {
      return null;
    }

    const json = await response.json().catch(() => null);
    // A token the caller has no totalSupply permission on is a normal configuration
    // state rather than a failure, so denials fall through to an absent value.
    if (!json || json.error || typeof json.result !== "string" || json.result === "0x") {
      return null;
    }

    try {
      return BigInt(json.result).toString();
    } catch {
      return null;
    }
  }
}
