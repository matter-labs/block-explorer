import request from "supertest";
import express from "express";
import cookieSession from "cookie-session";
import { applyPrividiumExpressConfig, applyPrividiumMiddlewares, applySwaggerAuthMiddleware } from "./prividium";
import { NestExpressApplication } from "@nestjs/platform-express";
import { mock } from "jest-mock-extended";
import { MiddlewareConsumer } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { MiddlewareConfigProxy } from "@nestjs/common/interfaces/middleware/middleware-config-proxy.interface";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { NoCacheMiddleware } from "./middlewares/no-cache.middleware";
import { AddUserRolesPipe } from "./api/pipes/addUserRoles.pipe";
import { RpcController } from "./rpc/rpc.controller";

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

  // The session cookie is SameSite=None, so another site can make the browser send it on a POST.
  describe("cross-site requests with the session cookie", () => {
    const appUrl = "https://blockexplorer.com";
    const attackerOrigin = "https://attacker.example";
    const rpcForm = "jsonrpc=2.0&id=1&method=eth_sendRawTransaction&params[0]=0x02f8";
    const rpcBody = { jsonrpc: "2.0", id: 1, method: "eth_sendRawTransaction", params: ["0x02f8"] };
    let app: NestExpressApplication;
    let agent: request.SuperAgentTest;
    let fetchSpy: jest.SpyInstance;

    const createApp = async (corsOrigins?: string[]) => {
      const moduleRef = await Test.createTestingModule({
        controllers: [RpcController],
        providers: [
          {
            provide: ConfigService,
            useValue: { get: (key: string) => ({ "prividium.permissionsApiUrl": "https://permissions-api.com" }[key]) },
          },
        ],
      }).compile();
      app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
      applyPrividiumExpressConfig(app, {
        sessionSecret: "secretvalue",
        appUrl,
        sessionMaxAge: 60_000,
        sessionSameSite: "none",
        corsOrigins,
      });
      app.use("/session", (req: express.Request, res: express.Response) => {
        req.session.address = "0x01";
        req.session.wallets = ["0x01"];
        req.session.token = "admin-token";
        res.send("ok");
      });
      await app.init();
      agent = request.agent(app.getHttpServer());
      await agent.get("/session").expect(200);
    };

    beforeEach(async () => {
      fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: "0xhash" }),
      } as Response);
      await createApp();
    });

    afterEach(async () => {
      fetchSpy.mockRestore();
      await app.close();
    });

    it("rejects a form POST to /rpc from another origin and does not forward it", async () => {
      await agent.post("/rpc").set("Origin", attackerOrigin).type("form").send(rpcForm).expect(403);
      expect(fetchSpy).not.toBeCalled();
    });

    it("rejects a JSON POST to /rpc from another origin and does not forward it", async () => {
      await agent.post("/rpc").set("Origin", attackerOrigin).send(rpcBody).expect(403);
      expect(fetchSpy).not.toBeCalled();
    });

    it("rejects a POST to /rpc from an opaque origin", async () => {
      await agent.post("/rpc").set("Origin", "null").send(rpcBody).expect(403);
      expect(fetchSpy).not.toBeCalled();
    });

    it("rejects a POST from a sibling subdomain of the app", async () => {
      await agent
        .post("/rpc")
        .set("Origin", "https://sub.blockexplorer.com")
        .set("Sec-Fetch-Site", "same-site")
        .send(rpcBody)
        .expect(403);
      expect(fetchSpy).not.toBeCalled();
    });

    it.each(["/auth/login", "/auth/logout", "/auth/switch-wallet"])(
      "rejects a form POST to %s from another origin",
      async (path) => {
        await agent.post(path).set("Origin", attackerOrigin).type("form").send("token=attacker-token").expect(403);
      }
    );

    it("rejects a form POST to /rpc that has no Origin and does not forward it", async () => {
      await agent.post("/rpc").type("form").send(rpcForm).expect(415);
      await agent.post("/rpc/").type("form").send(rpcForm).expect(415);
      await agent.post("/rpc").set("Content-Type", "text/plain").send(JSON.stringify(rpcBody)).expect(415);
      expect(fetchSpy).not.toBeCalled();
    });

    it("forwards a JSON POST to /rpc from the app origin with the session token", async () => {
      const res = await agent.post("/rpc").set("Origin", appUrl).send(rpcBody).expect(201);

      expect(res.body).toEqual({ jsonrpc: "2.0", id: 1, result: "0xhash" });
      expect(fetchSpy).toBeCalledWith(new URL("https://permissions-api.com/rpc"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer admin-token" },
        body: JSON.stringify(rpcBody),
      });
    });

    it("forwards a JSON POST to /rpc with a charset from the app origin", async () => {
      await agent
        .post("/rpc")
        .set("Origin", appUrl)
        .set("Content-Type", "application/json; charset=utf-8")
        .send(JSON.stringify(rpcBody))
        .expect(201);
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("forwards a same-origin JSON POST to /rpc, e.g. from the API docs", async () => {
      await agent
        .post("/rpc")
        .set("Origin", "https://api.blockexplorer.com")
        .set("Sec-Fetch-Site", "same-origin")
        .send(rpcBody)
        .expect(201);
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("forwards a JSON POST to /rpc without an Origin", async () => {
      await agent.post("/rpc").send(rpcBody).expect(201);
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("allows GET requests from another origin", async () => {
      await agent.get("/session").set("Origin", attackerOrigin).expect(200);
    });

    it("allows POSTs from the configured CORS origins only", async () => {
      await app.close();
      await createApp(["https://sso.example.com"]);

      await agent.post("/rpc").set("Origin", "https://sso.example.com").send(rpcBody).expect(201);
      await agent.post("/rpc").set("Origin", appUrl).send(rpcBody).expect(403);
      expect(fetchSpy).toBeCalledTimes(1);
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
    transformSpy.mockResolvedValue({
      address: "0x123",
      token: "valid-token",
      roles: ["user"],
      hasFullReadAccess: false,
    });
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
    transformSpy.mockResolvedValue({
      address: "0x123",
      token: "valid-token",
      roles: ["admin"],
      hasFullReadAccess: true,
    });
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
