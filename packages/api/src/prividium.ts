import { MiddlewareConsumer } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import { AuthController } from "./auth/auth.controller";
import { RpcModule } from "./rpc/rpc.module";
import { NoCacheMiddleware } from "./middlewares/no-cache.middleware";
import { AddUserRolesPipe } from "./api/pipes/addUserRoles.pipe";
import { ExplorerSessionVerifier } from "./auth/explorerSession";
import { PrividiumApiError } from "./errors/prividiumApiError";
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
    corsOrigins,
    trustXForwardedFor,
  }: {
    sessionSecret: string;
    appUrl: string;
    sessionMaxAge: number;
    sessionSameSite: "none" | "strict" | "lax";
    corsOrigins?: string[];
    trustXForwardedFor?: string[];
  }
) {
  app.set("trust proxy", trustXForwardedFor ?? 1);
  // Without this, `/API/...` reaches the `/api/...` handler that AuthMiddleware gates.
  app.set("case sensitive routing", true);
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
    origin: corsOrigins ?? appUrl,
    credentials: true,
  });
  // The session cookie is sent with requests from any site and CORS only hides the response, so
  // state-changing requests are refused unless they come from the CORS origins or the API's own
  // pages (docs). Browsers send an Origin on them (`null` when opaque); other clients may not.
  const allowedOrigins = corsOrigins ?? [appUrl];
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (
      !SAFE_METHODS.has(req.method) &&
      origin !== undefined &&
      !allowedOrigins.includes(origin) &&
      req.headers["sec-fetch-site"] !== "same-origin"
    ) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  });
  // An HTML form is posted without a preflight and the urlencoded parser turns its fields into
  // a JSON-RPC call, so the RPC proxy only accepts JSON bodies.
  app.use("/rpc", (req: Request, res: Response, next: NextFunction) => {
    if (!SAFE_METHODS.has(req.method) && !req.is("application/json")) {
      res.status(415).json({ message: "Unsupported Media Type" });
      return;
    }
    next();
  });
}

// Swagger is served ahead of the Nest middleware, so this gate checks the session token itself.
export function applySwaggerAuthMiddleware(
  app: NestExpressApplication,
  configService: ConfigService,
  explorerSessions: ExplorerSessionVerifier
) {
  app.use("/docs", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.address || !req.session?.token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      await explorerSessions.verify(configService.get("prividium.permissionsApiUrl"), req.session.token);
    } catch (error) {
      if (error instanceof PrividiumApiError) {
        req.session = null;
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      res.status(502).json({ message: "Auth service unavailable" });
      return;
    }

    const addUserRolesPipe = new AddUserRolesPipe(configService);
    try {
      const userWithRoles = await addUserRolesPipe.transform({
        address: req.session.address,
        wallets: req.session.wallets ?? [req.session.address],
        token: req.session.token,
      });
      if (!userWithRoles?.hasAdminRead && !userWithRoles?.hasFullReadAccess) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
    } catch {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    next();
  });
}

export function applyPrividiumMiddlewares(consumer: MiddlewareConsumer) {
  consumer.apply(NoCacheMiddleware).forRoutes(AuthController);
  consumer.apply(AuthMiddleware).forRoutes("*");
}

export const PRIVIDIUM_MODULES = [AuthModule, RpcModule];
