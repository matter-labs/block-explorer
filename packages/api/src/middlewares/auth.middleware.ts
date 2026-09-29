import { BadGatewayException, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { parseReqPathname } from "../common/utils";
const UNPROTECTED_ROUTES = new Set(["/auth/login", "/auth/logout", "/health", "/ready"]);

const userWalletsSchema = z.object({ wallets: z.array(z.string()) });

function throwUpstreamError(): never {
  throw new BadGatewayException("Auth service unavailable");
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  public async use(req: Request, res: Response, next: NextFunction) {
    const pathname = parseReqPathname(req);

    if (UNPROTECTED_ROUTES.has(pathname)) {
      next();
      return;
    }

    if (!req.session.address || !req.session.token || !req.session.wallets) {
      req.session = null;
      throw new UnauthorizedException({ message: "Unauthorized request" });
    }

    // Wallets can be removed from the user after login, so the selected one must still be in the live list.
    const wallets = await this.fetchUserWallets(req.session.token);
    if (!wallets?.some((wallet) => wallet.toLowerCase() === req.session.address.toLowerCase())) {
      req.session = null;
      throw new UnauthorizedException({ message: "Unauthorized request" });
    }
    req.session.wallets = wallets;

    // Update a value in the session to reset the expiration time.
    // Note: this is a cookie-session limitation, we can't send 'Set-Cookie'
    // headers without modifying the session object.
    req.session._nowInMinutes = Math.floor(Date.now() / 1000 / 60);
    next();
  }

  // Returns null when the permissions API rejects the token.
  private async fetchUserWallets(token: string): Promise<string[] | null> {
    const response = await fetch(new URL("/api/user-wallets", this.configService.get("prividium.permissionsApiUrl")), {
      headers: { Authorization: `Bearer ${token}` },
      // AbortSignal.timeout exists in Node 18 but is missing from the TypeScript 4.7 DOM typings.
      signal: (AbortSignal as typeof AbortSignal & { timeout(milliseconds: number): AbortSignal }).timeout(10_000),
    }).catch(throwUpstreamError);
    if (response.status === 401 || response.status === 403) {
      return null;
    }
    if (response.status !== 200) {
      throwUpstreamError();
    }

    const validatedData = userWalletsSchema.safeParse(await response.json().catch(throwUpstreamError));
    if (!validatedData.success) {
      throwUpstreamError();
    }

    return validatedData.data.wallets;
  }
}
