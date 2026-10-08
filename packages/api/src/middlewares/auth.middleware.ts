import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
  BadGatewayException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response, NextFunction } from "express";
import { parseReqPathname } from "../common/utils";
import { AddUserRolesPipe, parseUserProfile } from "../api/pipes/addUserRoles.pipe";
import { ExplorerSessionVerifier } from "../auth/explorerSession";
import { PrividiumApiError } from "../errors/prividiumApiError";
const UNPROTECTED_ROUTES = new Set(["/auth/login", "/auth/logout", "/health", "/ready"]);

function throwUpstreamError(): never {
  throw new BadGatewayException("Auth service unavailable");
}

const API_ROUTES_ROOT_PATH = "/api";

// Express routes case-insensitively, so `/API/...` hits the `/api/...` handler — classify it the same way.
export const isApiRoutePathname = (pathname: string): boolean => {
  const normalized = pathname.toLowerCase();
  return normalized === API_ROUTES_ROOT_PATH || normalized.startsWith(`${API_ROUTES_ROOT_PATH}/`);
};

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly explorerSessions = new ExplorerSessionVerifier();

  constructor(private configService: ConfigService) {}

  public async use(req: Request, _res: Response, next: NextFunction) {
    const pathname = parseReqPathname(req);

    if (UNPROTECTED_ROUTES.has(pathname)) {
      next();
      return;
    }

    if (isApiRoutePathname(pathname)) {
      const token = req.headers.authorization?.split(" ")[1];
      const apiKey = req.headers["x-api-key"];
      let hasFullReadAccess: boolean;
      if (token) {
        const addUserRolesPipe = new AddUserRolesPipe(this.configService);
        ({ hasFullReadAccess } = await addUserRolesPipe.transform({ address: "", wallets: [], token }));
        await this.assertExplorerSession(token);
      } else if (typeof apiKey === "string" && apiKey) {
        ({ hasFullReadAccess } = await this.fetchM2mAppPermissions(apiKey, req.ip));
      } else {
        throw new UnauthorizedException({ message: "Unauthorized request" });
      }
      if (!hasFullReadAccess) {
        // Only users/m2m apps with full read access can use the API for now
        throw new ForbiddenException({ message: "Forbidden request" });
      }
      next();
      return;
    }

    if (!req.session.address || !req.session.token || !req.session.wallets) {
      req.session = null;
      throw new UnauthorizedException({ message: "Unauthorized request" });
    }

    if (!req.session.expiresAt || new Date(req.session.expiresAt) < new Date()) {
      req.session = null;
      throw new PrividiumApiError({ message: "Session expired" }, 401);
    }

    // Update a value in the session to reset the expiration time.
    // Note: this is a cookie-session limitation, we can't send 'Set-Cookie'
    // headers without modifying the session object.
    req.session._nowInMinutes = Math.floor(Date.now() / 1000 / 60);
    next();
  }

  // A token issued to another application is the user's on the permissions API but not an explorer credential.
  private async assertExplorerSession(token: string) {
    try {
      await this.explorerSessions.assert(this.configService.get("prividium.permissionsApiUrl"), token);
    } catch (error) {
      if (error instanceof PrividiumApiError) {
        throw error;
      }
      throwUpstreamError();
    }
  }

  // M2M apps use an API key, which the permissions API only accepts from the app's whitelisted IPs,
  // so the client's IP is forwarded.
  private async fetchM2mAppPermissions(apiKey: string, clientIp?: string) {
    const response = await fetch(
      new URL("/api/m2m-app-queries/me", this.configService.get("prividium.permissionsApiUrl")),
      { headers: { "x-api-key": apiKey, ...(clientIp && { "X-Forwarded-For": clientIp }) } }
    ).catch(throwUpstreamError);
    if (response.status === 401) {
      throw new PrividiumApiError("Authentication failed", 401);
    }
    if (response.status !== 200) {
      throwUpstreamError();
    }
    try {
      return parseUserProfile(await response.json());
    } catch {
      return throwUpstreamError();
    }
  }
}
