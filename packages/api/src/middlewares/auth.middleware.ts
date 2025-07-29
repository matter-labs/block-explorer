import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { parseReqPathname } from "../common/utils";
const UNPROTECTED_ROUTES = new Set(["/auth/login", "/auth/logout", "/health", "/ready"]);

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction) {
    const pathname = parseReqPathname(req);

    if (UNPROTECTED_ROUTES.has(pathname)) {
      next();
      return;
    }

    if (!req.session.address || !req.session.token) {
      req.session = null;
      throw new UnauthorizedException({ message: "Unauthorized request" });
    }

    // Update a value in the session to reset the expiration time.
    // Note: this is a cookie-session limitation, we can't send 'Set-Cookie'
    // headers without modifying the session object.
    req.session._nowInMinutes = Math.floor(Date.now() / 1000 / 60);
    next();
  }
}
