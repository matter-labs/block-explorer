import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv";
import { getDatabaseConnectionOptions, getDatabaseConfig } from "./database.config";

config();

const dbOptions = getDatabaseConnectionOptions();
const dbConfig = getDatabaseConfig();

// When SSL is enabled, use individual connection params instead of URL
// because TypeORM doesn't properly apply SSL config with URL
const connectionConfig = dbOptions.ssl
  ? {
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
    }
  : { url: dbOptions.url };

export const typeOrmModuleOptions: DataSourceOptions = {
  type: "postgres",
  ...connectionConfig,
  ...(dbOptions.ssl && { ssl: dbOptions.ssl }),
  poolSize: parseInt(process.env.DATABASE_CONNECTION_POOL_SIZE, 10) || 100,
  extra: {
    idleTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_IDLE_TIMEOUT_MS, 10) || 12000,
    ...(dbOptions.ssl && { ssl: dbOptions.ssl }),
  },
  applicationName: "block-explorer-worker",
  migrationsRun: false,
  synchronize: false,
  logging: false,
  subscribers: [],
  migrations: ["dist/migrations/*.js"],
};
const typeOrmCliDataSource = new DataSource({
  ...typeOrmModuleOptions,
  entities: ["src/**/*.entity.{ts,js}"],
  migrations: ["src/migrations/*.ts"],
});

export default typeOrmCliDataSource;
