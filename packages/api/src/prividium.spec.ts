import request from "supertest";
import express from "express";
import { applyPrividiumExpressConfig, applyPrividiumMiddlewares } from "./prividium";
import { NestExpressApplication } from "@nestjs/platform-express";
import { mock } from "jest-mock-extended";
import { MiddlewareConsumer } from "@nestjs/common";
import { MiddlewareConfigProxy } from "@nestjs/common/interfaces/middleware/middleware-config-proxy.interface";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { NoCacheMiddleware } from "./middlewares/no-cache.middleware";

describe("applyPrividiumExpressConfig", () => {
  it("allows to set cookies", async () => {
    const app = express();
    (app as any).enableCors = jest.fn(); // Fix for prividium express config
    applyPrividiumExpressConfig(app as unknown as NestExpressApplication, {
      sessionSecret: "secretvalue",
      appUrl: "https://blockexplorer.com",
      sessionMaxAge: 1000,
      sessionSameSite: "strict",
    });
    const nonce = "somenonce";
    app.get("/test", (req, res) => {
      req.session.nonce = nonce;
      res.send("ok");
    });
    const res = await request(app).get("/test").expect(200);
    const cookies = res.get("set-cookie");
    expect(cookies.length).toEqual(2);
  });

  it("uses corsOrigins array when provided", () => {
    const app = express();
    const enableCorsMock = jest.fn();
    (app as any).enableCors = enableCorsMock;
    applyPrividiumExpressConfig(app as unknown as NestExpressApplication, {
      sessionSecret: "secretvalue",
      appUrl: "https://blockexplorer.com",
      sessionMaxAge: 1000,
      sessionSameSite: "strict",
      corsOrigins: ["https://blockexplorer.com", "https://sso.example.com"],
    });
    expect(enableCorsMock).toHaveBeenCalledWith({
      origin: ["https://blockexplorer.com", "https://sso.example.com"],
      credentials: true,
    });
  });

  it("falls back to appUrl when corsOrigins is not provided", () => {
    const app = express();
    const enableCorsMock = jest.fn();
    (app as any).enableCors = enableCorsMock;
    applyPrividiumExpressConfig(app as unknown as NestExpressApplication, {
      sessionSecret: "secretvalue",
      appUrl: "https://blockexplorer.com",
      sessionMaxAge: 1000,
      sessionSameSite: "strict",
    });
    expect(enableCorsMock).toHaveBeenCalledWith({
      origin: "https://blockexplorer.com",
      credentials: true,
    });
  });
});

describe("applyPrividiumMiddlewares", () => {
  it("adds the correct middlewares", () => {
    const consumer = mock<MiddlewareConsumer>();
    const middlewareConfig = mock<MiddlewareConfigProxy>();
    consumer.apply.mockReturnValue(middlewareConfig);
    applyPrividiumMiddlewares(consumer);
    expect(consumer.apply).toHaveBeenCalledTimes(2);
    expect(consumer.apply).toHaveBeenCalledWith(AuthMiddleware);
    expect(consumer.apply).toHaveBeenCalledWith(NoCacheMiddleware);
  });
});
