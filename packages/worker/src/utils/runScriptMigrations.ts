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
  await addScriptMigrationsToDB(scriptMigrationRepository, logger, Number(latestMigration?.timestamp || 0));
  await runScriptMigrations(scriptMigrationRepository, dataSource, logger, Number(latestMigration?.timestamp || 0));
};

const runScriptMigrations = async (
  scriptMigrationRepository: ScriptMigrationRepository,
  dataSource: DataSource,
  logger: Logger,
  latestDBMigrationTimestamp: number
) => {
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
      if (latestDBMigrationTimestamp > scriptMigration.timestamp) {
        // skip script migration if there are already newer regular DB migrations executed as it might be outdated and impossible to execute
        await scriptMigrationRepository.update(
          { number: scriptMigration.number },
          { status: ScriptMigrationStatus.Outdated }
        );
        continue;
      }

      const migrationRunner: ScriptMigrationRunner = await import(`../scriptMigrations/${scriptMigration.name}`);
      try {
        logger.log(`Starting script migration ${scriptMigration.name}`);
        if (scriptMigration.status !== ScriptMigrationStatus.Pending) {
          await scriptMigrationRepository.update(
            { number: scriptMigration.number },
            { status: ScriptMigrationStatus.Pending }
          );
        }
        await migrationRunner.run(scriptMigrationRepository, dataSource, logger);
        logger.log(`Script migration ${scriptMigration.name} completed`);
        await scriptMigrationRepository.update(
          { number: scriptMigration.number },
          { status: ScriptMigrationStatus.Completed }
        );
      } catch (error) {
        logger.error(`Script migration ${scriptMigration.name} failed`);
        await scriptMigrationRepository.update(
          { number: scriptMigration.number },
          { status: ScriptMigrationStatus.Failed }
        );
        throw error;
      }
    }
  } catch (error) {
    logger.error({
      message: "Failed to execute script migrations",
      stack: error.stack,
    });
  }
};

const addScriptMigrationsToDB = async (
  scriptMigrationRepository: ScriptMigrationRepository,
  logger: Logger,
  latestDBMigrationTimestamp: number
) => {
  try {
    let scriptMigrationFileNames = await readdir(path.join(__dirname, "../scriptMigrations"), "utf-8");
    scriptMigrationFileNames = scriptMigrationFileNames
      .filter((scriptMigrationFileName) => scriptMigrationFileName.endsWith(".ts"))
      .sort((a, b) => (a > b ? 1 : -1));

    for (const scriptMigrationFileName of scriptMigrationFileNames) {
      const [timestampPart, namePart] = scriptMigrationFileName.replace(".ts", "").split("-");
      const scriptMigrationName = `${namePart}${timestampPart}`;
      const scriptMigrationTimestamp = Number(timestampPart);
      if (!scriptMigrationTimestamp) {
        continue;
      }
      if (latestDBMigrationTimestamp > scriptMigrationTimestamp) {
        // skip script migration if there are already newer regular DB migrations executed as it might be outdated and impossible to execute
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
};
