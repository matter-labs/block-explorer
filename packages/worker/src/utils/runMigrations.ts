import { DataSource } from "typeorm";
import { Logger } from "@nestjs/common";
import { setTimeout } from "timers/promises";

const MIGRATIONS_LOCK_CHECK_INTERVAL = 10000;
const CREATE_LOCK_TABLE_SQL = "CREATE TABLE _lock (id bigint NOT NULL, PRIMARY KEY (id))";
const DROP_LOCK_TABLE_SQL = "DROP TABLE _lock";

export default async (connection: DataSource, logger: Logger) => {
  while (true) {
    try {
      await connection.query(CREATE_LOCK_TABLE_SQL);
      break;
    } catch (err) {
      logger.warn("Database is locked for migrations. Waiting for release...");
      await setTimeout(MIGRATIONS_LOCK_CHECK_INTERVAL);
    }
  }

  try {
    logger.log("_lock created, running migrations if there are any to run");
    await connection.runMigrations();
  } finally {
    await connection.query(DROP_LOCK_TABLE_SQL);
    logger.log("_lock removed, migrations completed");
  }
};
