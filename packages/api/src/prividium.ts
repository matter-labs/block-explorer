import { MiddlewareConsumer } from "@nestjs/common";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import cookieSession from "cookie-session";
import { NestExpressApplication } from "@nestjs/platform-express";

export function applyPrividiumExpressConfig(
  app: NestExpressApplication,
  { sessionSecret, appUrl }: { sessionSecret: string; appUrl: string }
) {
  app.use(
    cookieSession({
      name: "_auth",
      secret: sessionSecret,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
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
}

export const PRIVIDIUM_MODULES = [AuthModule];
