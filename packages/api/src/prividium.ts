import { MiddlewareConsumer } from "@nestjs/common";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import { AuthController } from "./auth/auth.controller";
import { NoCacheMiddleware } from "./middlewares/no-cache.middleware";
import cookieSession from "cookie-session";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Request, Response, NextFunction } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function applyPrividiumExpressConfig(
  app: NestExpressApplication,
  {
    sessionSecret,
    appUrl,
    sessionMaxAge,
    sessionSameSite,
  }: { sessionSecret: string; appUrl: string; sessionMaxAge: number; sessionSameSite: "none" | "strict" | "lax" }
) {
  app.set("trust proxy", 1);
  app.use(
    cookieSession({
      name: "_auth",
      secret: sessionSecret,
      maxAge: sessionMaxAge,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: sessionSameSite,
      path: "/",
    })
  );
  app.enableCors({
    origin: appUrl,
    credentials: true,
  });
  // The session cookie is sent with requests from any site and CORS only hides the response, so
  // state-changing requests are refused unless they come from the app or the API's own pages
  // (docs). Browsers send an Origin on them (`null` when opaque); other clients may not.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (
      !SAFE_METHODS.has(req.method) &&
      origin !== undefined &&
      origin !== appUrl &&
      req.headers["sec-fetch-site"] !== "same-origin"
    ) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  });
}

export function applyPrividiumMiddlewares(consumer: MiddlewareConsumer) {
  consumer.apply(NoCacheMiddleware).forRoutes(AuthController);
  consumer.apply(AuthMiddleware).forRoutes("*");
}

export const PRIVIDIUM_MODULES = [AuthModule];
