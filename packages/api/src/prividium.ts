import { MiddlewareConsumer } from "@nestjs/common";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import cookieSession from "cookie-session";
import { NestExpressApplication } from "@nestjs/platform-express";
import { PrividiumFilteringMiddleware } from "./middlewares/prividium-filtering.middleware";

export function applyPrividiumExpressConfig(
  app: NestExpressApplication,
  { sessionSecret, appUrl, sessionMaxAge }: { sessionSecret: string; appUrl: string; sessionMaxAge: number }
) {
  app.use(
    cookieSession({
      name: "_auth",
      secret: sessionSecret,
      maxAge: sessionMaxAge,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    })
  );
  app.enableCors({
    origin: appUrl,
    credentials: true,
  });
}

export function applyPrividiumMiddlewares(consumer: MiddlewareConsumer) {
  consumer.apply(AuthMiddleware).forRoutes("*");
  consumer.apply(PrividiumFilteringMiddleware).forRoutes("*");
}

export const PRIVIDIUM_MODULES = [AuthModule];
