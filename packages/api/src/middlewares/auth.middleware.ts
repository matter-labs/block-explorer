import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response, NextFunction } from "express";
import { parseReqPathname } from "../common/utils";
import { AddUserRolesPipe } from "../api/pipes/addUserRoles.pipe";
import { PrividiumApiError } from "../errors/prividiumApiError";
const UNPROTECTED_ROUTES = new Set(["/auth/login", "/auth/logout", "/health", "/ready"]);

const API_ROUTES_ROOT_PATH = "/api";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  public async use(req: Request, _res: Response, next: NextFunction) {
    const pathname = parseReqPathname(req);

    if (UNPROTECTED_ROUTES.has(pathname)) {
      next();
      return;
    }

    if (pathname.startsWith(API_ROUTES_ROOT_PATH)) {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new UnauthorizedException({ message: "Unauthorized request" });
      }
      const addUserRolesPipe = new AddUserRolesPipe(this.configService);
      const userWithRoles = await addUserRolesPipe.transform({ address: "", token });
      if (!userWithRoles.isAdmin) {
        // Only admin users can access the API for now
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
}
