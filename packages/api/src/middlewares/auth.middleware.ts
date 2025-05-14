import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

const UNPROTECTED_ROUTES = ["/health", "/ready"];

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction) {
    if (UNPROTECTED_ROUTES.some((route) => req.path.startsWith(route))) {
      next();
      return;
    }

    if (!req.session.siwe) {
      throw new UnauthorizedException({ message: "Unauthorized request" });
    }

    // Update a value in the session to reset the expiration time.
    // Note: this is a cookie-session limitation, we can't send 'Set-Cookie'
    // headers without modifying the session object.
    req.session._nowInMinutes = Math.floor(Date.now() / 1000 / 60);
    next();
  }
}
