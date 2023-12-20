import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import logger from "./logger";
import { AppModule } from "./app.module";

import { initializeApp } from "firebase/app";
import { getFirestore, onSnapshot, doc } from "firebase/firestore";

const firebaseApp = initializeApp({
  projectId: "scan-v2",
});
const db = getFirestore(firebaseApp);

const getConfig = async (instanceId: string): Promise<{ fromBlock: string; toBlock: string }> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      doc(db, "config", "worker"),
      (data) => {
        if (data.exists()) {
          const config = data.data() as Record<string, { fromBlock: string; toBlock: string }>;
          if (config[instanceId] && config[instanceId].fromBlock && config[instanceId].toBlock) {
            unsubscribe();
            resolve(config[instanceId]);
          }
        }
      },
      (e) => {
        logger.error(e);
        reject(e);
      }
    );
  });
};

async function bootstrap() {
  process.on("uncaughtException", function (error) {
    logger.error(error.message, error.stack, "UnhandledExceptions");
    process.exit(1);
  });

  if (process.env.USE_REMOTE_CONFIG === "true") {
    const config = await getConfig(process.env.HOSTNAME);
    if (!config.fromBlock || !config.toBlock) {
      throw new Error("Missing fromBlock or toBlock in config");
    }
    logger.log(`Using fromBlock: ${config.fromBlock}, toBlock: ${config.toBlock}`);
    process.env.FROM_BLOCK = config.fromBlock;
    process.env.TO_BLOCK = config.toBlock;
    process.env.DISABLE_BATCHES_PROCESSING = "true";
    process.env.DISABLE_COUNTERS_PROCESSING = "true";
    process.env.DISABLE_OLD_BALANCES_CLEANER = "true";
    process.env.DISABLE_BLOCKS_REVERT = "true";
  }

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const configService = app.get(ConfigService);
  app.enableShutdownHooks();
  await app.listen(configService.get("port"));
}

bootstrap();
