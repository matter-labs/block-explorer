import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv";
import { getDatabaseConnectionOptions } from "./database.config";

config();

const dbOptions = getDatabaseConnectionOptions();

export const typeOrmModuleOptions: DataSourceOptions = {
  type: "postgres",
  url: dbOptions.url,
  ...(dbOptions.ssl && { ssl: dbOptions.ssl }),
  poolSize: parseInt(process.env.DATABASE_CONNECTION_POOL_SIZE, 10) || 100,
  extra: {
    idleTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_IDLE_TIMEOUT_MS, 10) || 12000,
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
