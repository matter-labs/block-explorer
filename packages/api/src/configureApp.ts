import { INestApplication, ValidationPipe } from "@nestjs/common";

export const configureApp = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: false,
      transform: true,
      whitelist: true,
    })
  );
};
