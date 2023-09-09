import { LoggerService } from "@nestjs/common";
import { utilities, WinstonModule } from "nest-winston";
import { format, transports, Logform } from "winston";

export const getLogger = (environment: string, logLevel: string): LoggerService => {
  let defaultLogLevel = "debug";
  const loggerFormatters: Logform.Format[] = [
    format.timestamp({
      format: "DD/MM/YYYY HH:mm:ss.SSS",
    }),
    format.ms(),
    utilities.format.nestLike("API", {}),
  ];

  if (environment === "production") {
    defaultLogLevel = "info";
    loggerFormatters.push(format.json());
  }

  return WinstonModule.createLogger({
    level: logLevel || defaultLogLevel,
    transports: [
      new transports.Console({
        format: format.combine(...loggerFormatters),
      }),
    ],
  });
};
