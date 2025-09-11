import { config } from "dotenv";
import { DataSource } from "typeorm";

interface RunConfig {
  prividium?: boolean;
}

export const run = async (action: (dataSource: DataSource) => Promise<void>, { prividium }: RunConfig = {}) => {
  config({ path: prividium ? ".env.prividium-test" : ".env.test" });

  const { DATABASE_URL } = process.env;
  const connectionStringWithoutDbName = DATABASE_URL.substring(0, DATABASE_URL.lastIndexOf("/"));

  const dataSource = new DataSource({
    type: "postgres",
    url: connectionStringWithoutDbName,
  });

  await dataSource.initialize();

  try {
    await action(dataSource);
  } finally {
    await dataSource.destroy();
  }
};
