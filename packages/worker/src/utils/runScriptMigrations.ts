import { DataSource, Not, Equal, And } from "typeorm";
import { Logger } from "@nestjs/common";
import { readdir } from "fs/promises";
import * as path from "path";
import { ScriptMigrationRepository } from "../repositories/scriptMigration.repository";
import { ScriptMigrationStatus } from "../entities/scriptMigration.entity";

const GET_LATEST_MIGRATION_SQL = `SELECT * FROM migrations ORDER BY timestamp DESC limit 1`;

export interface ScriptMigrationRunner {
  name: string;
  run: (scriptMigrationRepository: ScriptMigrationRepository, dataSource: DataSource, logger: Logger) => Promise<void>;
}

export default async (scriptMigrationRepository: ScriptMigrationRepository, dataSource: DataSource, logger: Logger) => {
  const latestMigration = (await dataSource.query(GET_LATEST_MIGRATION_SQL))[0];

  try {
    let scriptMigrationFileNames = await readdir(path.join(__dirname, "../scriptMigrations"), "utf-8");
    scriptMigrationFileNames = scriptMigrationFileNames.sort((a, b) => (a > b ? 1 : -1));

    for (const scriptMigrationFileName of scriptMigrationFileNames) {
      if (!scriptMigrationFileName.endsWith(".ts")) {
        continue;
      }
      const [timestampPart, namePart] = scriptMigrationFileName.replace(".ts", "").split("-");
      const scriptMigrationName = `${namePart}${timestampPart}`;
      const scriptMigrationTimestamp = Number(timestampPart);
      if (!scriptMigrationTimestamp) {
        continue;
      }
      if (Number(latestMigration.timestamp) > scriptMigrationTimestamp) {
        // skip script migration if there are already newer regular migrations executed as it might be outdated and impossible to execute
        continue;
      }
      const existingScriptMigration = await scriptMigrationRepository.findOneBy({
        name: scriptMigrationName,
      });
      if (!existingScriptMigration) {
        await scriptMigrationRepository.add({
          name: scriptMigrationName,
          timestamp: scriptMigrationTimestamp,
        });
      }
    }
  } catch (error) {
    logger.error({
      message: "Failed to add script migrations to the DB",
      stack: error.stack,
    });
  }

  try {
    const scriptMigrationsToRun = await scriptMigrationRepository.find({
      where: {
        status: And(Not(Equal(ScriptMigrationStatus.Completed)), Not(Equal(ScriptMigrationStatus.Outdated))),
      },
      order: {
        timestamp: "ASC",
      },
    });
    if (!scriptMigrationsToRun.length) {
      return;
    }
    for (const scriptMigration of scriptMigrationsToRun) {
      if (Number(latestMigration.timestamp) > scriptMigration.timestamp) {
        // skip script migration if there are already newer regular migrations executed as it might be outdated and impossible to execute
        await scriptMigrationRepository.update(
          { number: scriptMigration.number },
          { status: ScriptMigrationStatus.Outdated }
        );
        continue;
      }
      const migrationRunner: ScriptMigrationRunner = await import(`../scriptMigrations/${scriptMigration.name}`);

      logger.log(`Starting script migration ${scriptMigration.name}`);
      try {
        await migrationRunner.run(scriptMigrationRepository, dataSource, logger);
        logger.log(`Script migration ${scriptMigration.name} completed`);
      } catch (error) {
        logger.error(`Script migration ${scriptMigration.name} failed`);
        throw error;
      }
    }
  } catch (error) {
    logger.error("Failed to execute script migrations");
  }
};
