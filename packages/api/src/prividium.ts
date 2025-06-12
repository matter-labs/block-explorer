import { INestApplication, MiddlewareConsumer } from "@nestjs/common";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import cookieSession from "cookie-session";
import { PrividiumFilteringMiddleware } from "./middlewares/prividium-filtering.middleware";

export function applyPrividiumExpressConfig(
  app: INestApplication,
  {
    sessionSecret,
    appUrl,
    sessionMaxAge,
    sessionSameSite,
  }: { sessionSecret: string; appUrl: string; sessionMaxAge: number; sessionSameSite: "none" | "strict" | "lax" }
) {
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
  consumer.apply(AuthMiddleware).forRoutes("*");
  consumer.apply(PrividiumFilteringMiddleware).forRoutes("*");
}

export const PRIVIDIUM_MODULES = [AuthModule];
