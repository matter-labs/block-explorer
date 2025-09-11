import { MiddlewareConsumer } from "@nestjs/common";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import { AuthController } from "./auth/auth.controller";
import { NoCacheMiddleware } from "./middlewares/no-cache.middleware";
import cookieSession from "cookie-session";
import { NestExpressApplication } from "@nestjs/platform-express";

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

export function applyPrividiumMiddlewares(consumer: MiddlewareConsumer) {
  consumer.apply(NoCacheMiddleware).forRoutes(AuthController);
  consumer.apply(AuthMiddleware).forRoutes("*");
}

export const PRIVIDIUM_MODULES = [AuthModule];
