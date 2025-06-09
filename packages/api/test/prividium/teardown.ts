import { run } from "../global/base";

declare const process: any;

export default async () => {
  // Clean up the Prividium test database
  await run(async (dataSource) => {
    const { DATABASE_URL } = process.env;
    const databaseName = DATABASE_URL.split("/").pop();

    try {
      await dataSource.query(`DROP DATABASE IF EXISTS "${databaseName}";`);
      console.log(`Cleaned up Prividium test database: ${databaseName}`);
    } catch (error) {
      console.error(`Failed to clean up test database ${databaseName}:`, error.message);
    }
  });
};
