import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configureApp";

describe("HealthController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    configureApp(app);
    app.enableShutdownHooks();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/health (GET) returns 200 OK", () => {
    return request(app.getHttpServer()).get("/health").expect(200);
  });

  it("/ready (GET) returns 200 OK", () => {
    return request(app.getHttpServer()).get("/ready").expect(200);
  });
});
