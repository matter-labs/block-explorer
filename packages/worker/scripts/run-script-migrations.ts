import { Logger } from "@nestjs/common";
import typeOrmCliDataSource from "../src/typeorm.config";
import runScriptMigrations from "../src/utils/runScriptMigrations";

(async () => {
  const logger = new Logger("ScriptMigrations");
  await runScriptMigrations(typeOrmCliDataSource, logger);
  logger.log("DONE");
})();
