import { DataSource } from "typeorm";
import { Logger } from "@nestjs/common";
import { setTimeout } from "timers/promises";

const MIGRATIONS_LOCK_CHECK_INTERVAL = 10000;
const ADVISORY_LOCK_KEY = 1234567; // arbitrary fixed key for migration lock

export default async (connection: DataSource, logger: Logger) => {
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();

  try {
    while (true) {
      const [{ pg_try_advisory_lock: acquired }] = await queryRunner.query("SELECT pg_try_advisory_lock($1)", [
        ADVISORY_LOCK_KEY,
      ]);

      if (acquired) {
        break;
      }

      logger.warn("Database is locked for migrations. Waiting for release...");
      await setTimeout(MIGRATIONS_LOCK_CHECK_INTERVAL);
    }

    logger.log("Lock acquired, running migrations if there are any to run");
    await connection.runMigrations();
  } finally {
    await queryRunner.query("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]);
    await queryRunner.release();
    logger.log("Lock released, migrations completed");
  }
};
