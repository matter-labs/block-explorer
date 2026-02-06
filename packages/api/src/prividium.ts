import { MiddlewareConsumer } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import { AuthController } from "./auth/auth.controller";
import { NoCacheMiddleware } from "./middlewares/no-cache.middleware";
import { AddUserRolesPipe } from "./api/pipes/addUserRoles.pipe";
import cookieSession from "cookie-session";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Request, Response, NextFunction } from "express";

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
}

export function applySwaggerAuthMiddleware(app: NestExpressApplication, configService: ConfigService) {
  app.use("/docs", async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.address || !req.session?.token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const addUserRolesPipe = new AddUserRolesPipe(configService);
    try {
      const userWithRoles = await addUserRolesPipe.transform({
        address: req.session.address,
        token: req.session.token,
      });
      if (!userWithRoles?.isAdmin) {
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

export const PRIVIDIUM_MODULES = [AuthModule];
