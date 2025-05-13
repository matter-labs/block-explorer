import { MiddlewareConsumer } from "@nestjs/common";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthModule } from "./auth/auth.module";
import cookieSession from "cookie-session";
import { NestExpressApplication } from "@nestjs/platform-express";
import { PrivateFilteringMiddleware } from "./middlewares/private-filtering.middleware";
import { AddressController } from "./address/address.controller";
import { TransactionController } from "./transaction/transaction.controller";

export function applyPrivateValidiumExpressConfig(app: NestExpressApplication) {
  app.use(
    cookieSession({
      name: "_auth",
      secret: process.env.PRIVATE_VALIDIUM_SESSION_SECRET,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    })
  );
}

export function applyPrivateValidiumMiddlewares(consumer: MiddlewareConsumer) {
  consumer.apply(AuthMiddleware).exclude("/auth/nonce", "/auth/verify", "/auth/logout").forRoutes("*");
  consumer.apply(PrivateFilteringMiddleware).forRoutes(AddressController, TransactionController);
}

export const PRIVATE_VALIDIUM_MODULES = [AuthModule];
