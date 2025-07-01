import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { configureApp } from "./configureApp";
import { getLogger } from "./logger";
import { AppModule } from "./app.module";
import { AppMetricsModule } from "./appMetrics.module";
import { prividium } from "./config/featureFlags";
import { applyPrividiumExpressConfig } from "./prividium";

const BODY_PARSER_SIZE_LIMIT = "10mb";

async function bootstrap() {
  const logger = getLogger(process.env.NODE_ENV, process.env.LOG_LEVEL);

  process.on("uncaughtException", function (error) {
    logger.error(error.message, error.stack, "UnhandledExceptions");
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection: ", reason);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule.build({ prividium }), {
    logger,
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const metricsApp = await NestFactory.create(AppMetricsModule);
  metricsApp.enableShutdownHooks();

  if (configService.get<boolean>("featureFlags.swagger.enabled")) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Block explorer API")
      .setDescription("ZkSync Block Explorer API")
      .setVersion("1.0")
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  if (prividium) {
    // Prividium config includes strict CORS configuration
    applyPrividiumExpressConfig(app, {
      sessionSecret: configService.get<string>("prividium.sessionSecret"),
      appUrl: configService.get<string>("prividium.appUrl"),
      sessionMaxAge: configService.get<number>("prividium.sessionMaxAge"),
      sessionSameSite: configService.get<"none" | "strict" | "lax">("prividium.sessionSameSite"),
    });
  } else {
    app.enableCors();
  }

  app.useBodyParser("json", { limit: BODY_PARSER_SIZE_LIMIT });
  app.useBodyParser("urlencoded", { limit: BODY_PARSER_SIZE_LIMIT, extended: true });
  app.use(helmet());
  configureApp(app);
  app.enableShutdownHooks();

  await app.listen(configService.get<number>("port"));
  await metricsApp.listen(configService.get<number>("metrics.port"));
}
bootstrap();
