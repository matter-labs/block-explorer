import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv";

config();

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  const host = process.env.DATABASE_HOST || "localhost";
  const port = parseInt(process.env.DATABASE_PORT) || 5432;
  const username = process.env.DATABASE_USER || "postgres";
  const password = process.env.DATABASE_PASSWORD || "postgres";
  const database = process.env.DATABASE_NAME || "block-explorer";
  dbUrl = `postgres://${username}:${password}@${host}:${port}/${database}`;
}

export const typeOrmModuleOptions: DataSourceOptions = {
  type: "postgres",
  url: dbUrl,
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
