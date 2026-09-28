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

  // The session cookie can be SameSite=None, so another site can make the browser send it on a form POST.
  describe("cross-site requests with the session cookie", () => {
    const appUrl = "https://blockexplorer.com";
    let app: express.Express;
    let handler: jest.Mock;

    beforeEach(() => {
      app = express();
      (app as any).enableCors = jest.fn(); // Fix for prividium express config
      applyPrividiumExpressConfig(app as unknown as NestExpressApplication, {
        sessionSecret: "secretvalue",
        appUrl,
        sessionMaxAge: 1000,
        sessionSameSite: "none",
      });
      handler = jest.fn((req, res) => res.send("ok"));
      app.all("/auth/login", handler);
    });

    it("rejects POSTs from other sites", async () => {
      for (const headers of [
        { Origin: "https://attacker.example" },
        { Origin: "null" },
        { Origin: "https://sub.blockexplorer.com", "Sec-Fetch-Site": "same-site" },
      ]) {
        const res = await request(app).post("/auth/login").set(headers).type("form").send("token=jwt").expect(403);
        expect(res.body).toEqual({ message: "Forbidden" });
      }
      expect(handler).not.toHaveBeenCalled();
    });

    it("allows POSTs from the app, from the API's own pages and from clients that send no Origin", async () => {
      await request(app).post("/auth/login").set("Origin", appUrl).send({ token: "jwt" }).expect(200);
      await request(app)
        .post("/auth/login")
        .set({ Origin: "https://api.blockexplorer.com", "Sec-Fetch-Site": "same-origin" })
        .send({ token: "jwt" })
        .expect(200);
      await request(app).post("/auth/login").send({ token: "jwt" }).expect(200);
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("allows GET requests from other sites", async () => {
      await request(app).get("/auth/login").set("Origin", "https://attacker.example").expect(200);
      expect(handler).toHaveBeenCalledTimes(1);
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
