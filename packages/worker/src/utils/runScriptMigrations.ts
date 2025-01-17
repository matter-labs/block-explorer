import { DataSource, Not, Equal, And } from "typeorm";
import { Logger } from "@nestjs/common";
import { readdir } from "fs/promises";
import * as path from "path";
import { ScriptMigration, ScriptMigrationStatus } from "../entities/scriptMigration.entity";

const GET_LATEST_MIGRATION_SQL = `SELECT timestamp FROM migrations ORDER BY timestamp DESC limit 1`;

export interface ScriptMigrationRunner {
  name: string;
  run: (dataSource: DataSource, logger: Logger) => Promise<void>;
}

export default async (dataSource: DataSource, logger: Logger) => {
  const latestMigration = (await dataSource.query(GET_LATEST_MIGRATION_SQL))[0];
  await addScriptMigrationsToDB(dataSource, logger, Number(latestMigration?.timestamp || 0));
  await runScriptMigrations(dataSource, logger, Number(latestMigration?.timestamp || 0));
};

const runScriptMigrations = async (dataSource: DataSource, logger: Logger, latestDBMigrationTimestamp: number) => {
  try {
    const scriptMigrationsToRun = await dataSource.manager.find(ScriptMigration, {
      where: {
        status: And(Not(Equal(ScriptMigrationStatus.Completed)), Not(Equal(ScriptMigrationStatus.Outdated))),
      },
      order: {
        timestamp: "ASC",
      },
    });

    if (!scriptMigrationsToRun.length) {
      logger.log(`No script migrations to run`);
      return;
    }

    for (const scriptMigration of scriptMigrationsToRun) {
      if (latestDBMigrationTimestamp > scriptMigration.timestamp) {
        // skip script migration if there are already newer regular DB migrations executed as it might be outdated and impossible to execute
        await dataSource.manager.update(
          ScriptMigration,
          { number: scriptMigration.number },
          { status: ScriptMigrationStatus.Outdated }
        );
        continue;
      }

      const migrationRunner: ScriptMigrationRunner = await import(`../scriptMigrations/${scriptMigration.name}`);
      try {
        logger.log(`Starting script migration ${scriptMigration.name}`);
        if (scriptMigration.status !== ScriptMigrationStatus.Pending) {
          await dataSource.manager.update(
            ScriptMigration,
            { number: scriptMigration.number },
            { status: ScriptMigrationStatus.Pending }
          );
        }
        await migrationRunner.run(dataSource, logger);
        logger.log(`Script migration ${scriptMigration.name} completed`);
        await dataSource.manager.update(
          ScriptMigration,
          { number: scriptMigration.number },
          { status: ScriptMigrationStatus.Completed }
        );
      } catch (error) {
        logger.error(`Script migration ${scriptMigration.name} failed`);
        await dataSource.manager.update(
          ScriptMigration,
          { number: scriptMigration.number },
          { status: ScriptMigrationStatus.Failed }
        );
        throw error;
      }
    }
    logger.log(`Completed script migrations`);
  } catch (error) {
    logger.error({
      message: "Failed to execute script migrations",
      stack: error.stack,
    });
  }
};

const addScriptMigrationsToDB = async (dataSource: DataSource, logger: Logger, latestDBMigrationTimestamp: number) => {
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
      const existingScriptMigration = await dataSource.manager.findOneBy(ScriptMigration, {
        name: scriptMigrationName,
      });
      if (!existingScriptMigration) {
        await dataSource.manager.insert(ScriptMigration, {
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
