import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { configureApp } from "./configureApp";
import { getLogger } from "./logger";
import { AppModule } from "./app.module";
import { AppMetricsModule } from "./appMetrics.module";

const BODY_PARSER_SIZE_LIMIT = "10mb";

function prividiumConfigFound() {
  return Object.keys(process.env).some(
    // Check for any prividium config, not only for feature flag setting
    (key) => key.toLowerCase().startsWith("prividium")
  );
}

async function bootstrap() {
  const logger = getLogger(process.env.NODE_ENV, process.env.LOG_LEVEL);

  if (prividiumConfigFound()) {
    logger.error(
      "Prividium env variable found. Prividium is not supported in this release of explorer. Please use the version that supports it."
    );
    process.exit(1);
  }

  process.on("uncaughtException", function (error) {
    logger.error(error.message, error.stack, "UnhandledExceptions");
    process.exit(1);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const metricsApp = await NestFactory.create(AppMetricsModule);
  metricsApp.enableShutdownHooks();

  if (configService.get<boolean>("featureFlags.swagger.enabled")) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Block explorer API")
      .setDescription("Sophon Block Explorer API")
      .setVersion("1.0")
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  app.useBodyParser("json", { limit: BODY_PARSER_SIZE_LIMIT });
  app.useBodyParser("urlencoded", { limit: BODY_PARSER_SIZE_LIMIT, extended: true });
  app.enableCors();
  app.use(helmet());
  configureApp(app);
  app.enableShutdownHooks();

  await app.listen(configService.get<number>("port"));
  await metricsApp.listen(configService.get<number>("metrics.port"));
}
bootstrap();
