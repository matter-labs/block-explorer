import { setupPrividiumTestEnvironment, validatePrividiumEnvironment } from "../prividium.env";
import { run } from "../global/base";

declare const process: any;

export default async () => {
  // Set up Prividium environment variables first
  setupPrividiumTestEnvironment();

  // Validate environment is properly configured
  validatePrividiumEnvironment();

  // Create the isolated Prividium test database
  await run(async (dataSource) => {
    const { DATABASE_URL } = process.env;
    const databaseName = DATABASE_URL.split("/").pop();

    // Drop existing test database if it exists
    try {
      await dataSource.query(`DROP DATABASE IF EXISTS "${databaseName}";`);
    } catch (error) {
      // Ignore error if database doesn't exist
      console.log(`Database ${databaseName} didn't exist, creating new one`);
    }

      // Create fresh test database
      await dataSource.query(`CREATE DATABASE "${databaseName}";`);
      console.log(`Created Prividium test database: ${databaseName}`);
    });
  } catch (error) {
    console.warn("Database setup failed - tests will run without database:", error.message);
    // Set a flag to indicate database is not available
    process.env.PRIVIDIUM_DB_UNAVAILABLE = "true";
  }
};
