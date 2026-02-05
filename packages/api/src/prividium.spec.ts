import request from "supertest";
import express from "express";
import cookieSession from "cookie-session";
import { applyPrividiumExpressConfig, applyPrividiumMiddlewares, applySwaggerAuthMiddleware } from "./prividium";
import { NestExpressApplication } from "@nestjs/platform-express";
import { mock } from "jest-mock-extended";
import { MiddlewareConsumer } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MiddlewareConfigProxy } from "@nestjs/common/interfaces/middleware/middleware-config-proxy.interface";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { NoCacheMiddleware } from "./middlewares/no-cache.middleware";
import { AddUserRolesPipe } from "./api/pipes/addUserRoles.pipe";

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

describe("applySwaggerAuthMiddleware", () => {
  let app: express.Express;
  let configService: ConfigService;
  let transformSpy: jest.SpyInstance;

  beforeEach(() => {
    app = express();
    app.use(
      cookieSession({
        name: "_auth",
        secret: "test-secret",
        maxAge: 1000,
      })
    );
    configService = mock<ConfigService>();
    transformSpy = jest.spyOn(AddUserRolesPipe.prototype, "transform");
  });

  afterEach(() => {
    transformSpy.mockRestore();
  });

  it("returns 401 for unauthenticated requests without session", async () => {
    applySwaggerAuthMiddleware(app as unknown as NestExpressApplication, configService);
    app.get("/docs", (_req, res) => res.send("docs"));

    const res = await request(app).get("/docs");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Unauthorized" });
  });

  it("returns 401 for requests with incomplete session (missing token)", async () => {
    app.use((req, _res, next) => {
      req.session = { address: "0x123" } as any;
      next();
    });
    applySwaggerAuthMiddleware(app as unknown as NestExpressApplication, configService);
    app.get("/docs", (_req, res) => res.send("docs"));

    const res = await request(app).get("/docs");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Unauthorized" });
  });

  it("returns 403 for authenticated non-admin users", async () => {
    app.use((req, _res, next) => {
      req.session = { address: "0x123", token: "valid-token" } as any;
      next();
    });
    transformSpy.mockResolvedValue({ address: "0x123", token: "valid-token", roles: ["user"], isAdmin: false });
    applySwaggerAuthMiddleware(app as unknown as NestExpressApplication, configService);
    app.get("/docs", (_req, res) => res.send("docs"));

    const res = await request(app).get("/docs");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Forbidden" });
  });

  it("allows admin users to access /docs", async () => {
    app.use((req, _res, next) => {
      req.session = { address: "0x123", token: "valid-token" } as any;
      next();
    });
    transformSpy.mockResolvedValue({ address: "0x123", token: "valid-token", roles: ["admin"], isAdmin: true });
    applySwaggerAuthMiddleware(app as unknown as NestExpressApplication, configService);
    app.get("/docs", (_req, res) => res.send("docs"));

    const res = await request(app).get("/docs");
    expect(res.status).toBe(200);
    expect(res.text).toBe("docs");
  });

  it("returns 401 when AddUserRolesPipe throws an error", async () => {
    app.use((req, _res, next) => {
      req.session = { address: "0x123", token: "invalid-token" } as any;
      next();
    });
    transformSpy.mockRejectedValue(new Error("Authentication failed"));
    applySwaggerAuthMiddleware(app as unknown as NestExpressApplication, configService);
    app.get("/docs", (_req, res) => res.send("docs"));

    const res = await request(app).get("/docs");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Unauthorized" });
  });
});
