import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { configureApp } from "./configureApp";
import { getLogger } from "./logger";
import { AppModule } from "./app.module";
import { AppMetricsModule } from "./appMetrics.module";

async function bootstrap() {
  const logger = getLogger(process.env.NODE_ENV, process.env.LOG_LEVEL);

  process.on("uncaughtException", function (error) {
    logger.error(error.message, error.stack, "UnhandledExceptions");
    process.exit(1);
  });

  const app = await NestFactory.create(AppModule, {
    logger,
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

  app.enableCors();
  app.use(helmet());
  configureApp(app);
  app.enableShutdownHooks();

  await app.listen(configService.get<number>("port"));
  await metricsApp.listen(configService.get<number>("metrics.port"));
}
bootstrap();
