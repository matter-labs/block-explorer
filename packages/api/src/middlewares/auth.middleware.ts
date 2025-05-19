import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { getUrlWithoutParams } from "../common/utils";

const UNPROTECTED_ROUTES = ["/auth/message", "/auth/verify", "/auth/logout", "/health", "/ready"];

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction) {
    const url = getUrlWithoutParams(req.originalUrl);

    if (UNPROTECTED_ROUTES.some((route) => url.startsWith(route))) {
      next();
      return;
    }

    if (!req.session.siwe || !req.session.verified) {
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
