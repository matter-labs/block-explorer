import { DataSource } from "typeorm";
import { Logger } from "@nestjs/common";
import { setTimeout } from "timers/promises";

const MIGRATIONS_LOCK_CHECK_INTERVAL = 10000;
const ADVISORY_LOCK_KEY = 1234567; // arbitrary fixed key for migration lock

export default async (connection: DataSource, logger: Logger, postMigrationsCallback?: () => Promise<void>) => {
  let queryRunner = null;

  while (true) {
    try {
      if (!queryRunner) {
        queryRunner = connection.createQueryRunner();
        await queryRunner.connect();
      }
    } catch (err) {
      logger.warn("Failed to connect to database, retrying...", err);
      if (queryRunner) {
        await queryRunner.release().catch(() => undefined);
        queryRunner = null;
      }
      await setTimeout(MIGRATIONS_LOCK_CHECK_INTERVAL);
      continue;
    }

    try {
      const [{ pg_try_advisory_lock: acquired }] = await queryRunner.query("SELECT pg_try_advisory_lock($1)", [
        ADVISORY_LOCK_KEY,
      ]);

      if (acquired) {
        break;
      }

      logger.warn("Database is locked for migrations. Waiting for release...");
      await setTimeout(MIGRATIONS_LOCK_CHECK_INTERVAL);
    } catch (err) {
      logger.warn("Failed to acquire migration lock, retrying...", err);
      await queryRunner.release().catch(() => undefined);
      queryRunner = null;
      await setTimeout(MIGRATIONS_LOCK_CHECK_INTERVAL);
    }
  }

  logger.log("Lock acquired, running migrations if there are any to run");
  try {
    await connection.runMigrations();
    if (postMigrationsCallback) {
      await postMigrationsCallback();
    }
  } finally {
    await queryRunner.query("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]);
    await queryRunner.release();
    logger.log("Lock released, migrations completed");
  }
};
