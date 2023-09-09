import { INestApplication, ValidationPipe } from "@nestjs/common";

export const configureApp = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: true,
      transform: true,
      whitelist: true,
    })
  );
};
