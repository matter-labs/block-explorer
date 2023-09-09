import { config } from "dotenv";
import { DataSource } from "typeorm";

config({ path: ".env.test" });

export const run = async (action: (dataSource: DataSource) => Promise<void>) => {
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
