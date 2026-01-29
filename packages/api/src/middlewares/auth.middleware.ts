import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { parseReqPathname } from "../common/utils";
import { PrividiumApiError } from "../errors/prividium-api-error";
const UNPROTECTED_ROUTES = new Set(["/auth/login", "/auth/logout", "/health", "/ready"]);

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction) {
    const pathname = parseReqPathname(req);

    if (UNPROTECTED_ROUTES.has(pathname)) {
      next();
      return;
    }

    if (!req.session.address || !req.session.token || !req.session.wallets) {
      req.session = null;
      throw new PrividiumApiError({ message: "Unauthorized request" }, 401);
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
