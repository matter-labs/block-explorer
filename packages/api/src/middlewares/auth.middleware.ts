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
// Reflects the cookie only, so it keeps answering while the permissions API is down.
const SESSION_INTROSPECTION_ROUTE = "/auth/me";

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
  constructor(private configService: ConfigService, private explorerSessions: ExplorerSessionVerifier) {}

  public async use(req: Request, _res: Response, next: NextFunction) {
    const pathname = parseReqPathname(req);

    if (UNPROTECTED_ROUTES.has(pathname)) {
      next();
      return;
    }

    if (isApiRoutePathname(pathname)) {
      const { hasFullReadAccess, hasFullWriteAccess } = await this.authenticateApiRequest(req, pathname);
      if (!hasFullReadAccess) {
        // Only users/m2m apps with full read access can use the API for now
        throw new ForbiddenException({ message: "Forbidden request" });
      }
      // Read access is enough here. Handlers marked with @RequiresFullWriteAccess() also need write access,
      // which FullWriteAccessGuard checks against req.identity after routing.
      req.identity = { hasFullReadAccess, hasFullWriteAccess };
      next();
      return;
    }

    await this.assertSession(req, pathname);
    next();
  }

  // API clients authenticate with a bearer token or an m2m app API key, the explorer app with its session cookie.
  private async authenticateApiRequest(req: Request, pathname: string) {
    const token = req.headers.authorization?.split(" ")[1];
    const apiKey = req.headers["x-api-key"];
    if (token) {
      const addUserRolesPipe = new AddUserRolesPipe(this.configService);
      const user = await addUserRolesPipe.transform({ address: "", wallets: [], token });
      await this.assertExplorerSession(token);
      return user;
    }
    if (typeof apiKey === "string" && apiKey) {
      return this.fetchM2mAppPermissions(apiKey, req.ip);
    }
    if (req.session?.token) {
      await this.assertSession(req, pathname);
      return this.fetchSessionUserPermissions(req);
    }
    throw new UnauthorizedException({ message: "Unauthorized request" });
  }

  // The permissions are read live, as for the explorer app's own routes, so role and wallet changes apply right away.
  private async fetchSessionUserPermissions(req: Request) {
    const addUserRolesPipe = new AddUserRolesPipe(this.configService);
    try {
      return await addUserRolesPipe.transform({
        address: req.session.address,
        wallets: req.session.wallets,
        token: req.session.token,
      });
    } catch (error) {
      if (error instanceof PrividiumApiError) {
        req.session = null;
      }
      throw error;
    }
  }

  private async assertSession(req: Request, pathname: string) {
    if (!req.session.address || !req.session.token || !req.session.wallets) {
      req.session = null;
      throw new UnauthorizedException({ message: "Unauthorized request" });
    }

    if (!req.session.expiresAt || new Date(req.session.expiresAt) < new Date()) {
      req.session = null;
      throw new PrividiumApiError({ message: "Session expired" }, 401);
    }

    // Verify legacy cookies that lack the audience marker now set at login.
    if (pathname !== SESSION_INTROSPECTION_ROUTE && req.session.audienceChecked !== true) {
      try {
        await this.assertExplorerSession(req.session.token);
        req.session.audienceChecked = true;
      } catch (error) {
        if (error instanceof PrividiumApiError) {
          req.session = null;
          throw new PrividiumApiError({ message: error.message }, 401);
        }
        throw error;
      }
    }

    // Update a value in the session to reset the expiration time.
    // Note: this is a cookie-session limitation, we can't send 'Set-Cookie'
    // headers without modifying the session object.
    req.session._nowInMinutes = Math.floor(Date.now() / 1000 / 60);
  }

  private async assertExplorerSession(token: string) {
    try {
      await this.explorerSessions.verify(this.configService.get("prividium.permissionsApiUrl"), token);
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
