import { utilities, WinstonModule } from "nest-winston";
import { format, transports, Logform } from "winston";

const { NODE_ENV, LOG_LEVEL } = process.env;

let defaultLogLevel = "debug";
const loggerFormatters: Logform.Format[] = [
  format.timestamp({
    format: "DD/MM/YYYY HH:mm:ss.SSS",
  }),
  format.ms(),
  utilities.format.nestLike("Worker", {}),
];

if (NODE_ENV === "production") {
  defaultLogLevel = "info";
  loggerFormatters.push(format.json());
}

export default WinstonModule.createLogger({
  level: LOG_LEVEL || defaultLogLevel,
  transports: [
    new transports.Console({
      format: format.combine(...loggerFormatters),
    }),
  ],
});
