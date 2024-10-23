import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import logger from "./logger";
import { AppModule } from "./app.module";
import overrideBigIntToJson from "./utils/overrideBigIntToJson";

overrideBigIntToJson();

async function bootstrap() {
  process.on("uncaughtException", function (error) {
    logger.error(error.message, error.stack, "UnhandledExceptions");
    process.exit(1);
  });

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const configService = app.get(ConfigService);
  app.enableShutdownHooks();
  await app.listen(configService.get("port"));
}

bootstrap();
